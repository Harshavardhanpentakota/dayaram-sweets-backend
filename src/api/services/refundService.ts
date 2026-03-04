import mongoose from 'mongoose';
import Refund, { IRefund } from '../../db/models/Refund';
import Order, { IOrder } from '../../db/models/Order';
import RazorpayPayment from '../../db/models/RazorpayPayment';
import Payment from '../../db/models/Payment';
import { razorpay } from '../../config/razorpay';

/**
 * Domain error carrying an HTTP status code so controllers can map service
 * failures to the right response without leaking internals.
 */
export class RefundError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'RefundError';
    this.statusCode = statusCode;
  }
}

// Amounts on Order (totalAmount / refundedAmount) and on Refund are stored in
// rupees. Razorpay and the RazorpayPayment table work in paise.
const toPaise = (rupees: number): number => Math.round(rupees * 100);
const toRupees = (paise: number): number => paise / 100;

const getRazorpayPaymentId = (order: IOrder): string | undefined =>
  order.razorpayDetails?.razorpay_payment_id;

const getOrderCurrency = (order: IOrder): string =>
  order.razorpayDetails?.currency || 'INR';

/**
 * Remaining amount (in rupees) that can still be refunded on an order.
 * Counts every non-failed refund (processed + in-flight) as committed so we
 * never over-commit across multiple partial refunds.
 */
export const calculateRemainingRefundableAmount = async (
  orderId: mongoose.Types.ObjectId | string,
  totalAmount: number
): Promise<number> => {
  const refunds = await Refund.find({ orderId, status: { $ne: 'failed' } });
  const committed = refunds.reduce((sum, r) => sum + r.amount, 0);
  return Math.max(0, totalAmount - committed);
};

/**
 * Throws if `amount` is not a valid, in-balance refund amount (rupees).
 */
export const validateRefundAmount = (amount: number, remaining: number): void => {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new RefundError('Refund amount must be greater than 0', 400);
  }
  if (amount > remaining) {
    throw new RefundError('Refund amount exceeds refundable balance', 400);
  }
};

/**
 * Recompute an order's refund roll-up state from its Refund records, so the
 * order stays consistent whether the trigger was an admin approval or a webhook.
 */
const recalcOrderRefundState = async (orderId: mongoose.Types.ObjectId | string): Promise<void> => {
  const order = await Order.findById(orderId);
  if (!order) return;

  const refunds = await Refund.find({ orderId });

  const processedAmount = refunds
    .filter((r) => r.status === 'processed')
    .reduce((sum, r) => sum + r.amount, 0);

  const hasInFlight = refunds.some((r) => r.status === 'approved');
  const hasRequested = refunds.some((r) => r.status === 'requested');
  const hasFailed = refunds.some((r) => r.status === 'failed');

  order.refundedAmount = processedAmount;

  if (processedAmount >= order.totalAmount && order.totalAmount > 0) {
    order.refundStatus = 'refunded';
    order.paymentStatus = 'refunded';
  } else if (processedAmount > 0) {
    order.refundStatus = 'partially_refunded';
  } else if (hasInFlight) {
    order.refundStatus = 'processing';
  } else if (hasRequested) {
    order.refundStatus = 'requested';
  } else if (hasFailed) {
    order.refundStatus = 'failed';
  } else {
    order.refundStatus = 'none';
  }

  await order.save();

  // Mirror the refund state onto the Payment record if one exists.
  if (processedAmount > 0) {
    await Payment.findOneAndUpdate(
      { orderId: order._id },
      { status: 'refunded', refundDate: new Date() }
    );
  }
};

/**
 * Record/refresh a refund on the RazorpayPayment table (paise). Idempotent on
 * razorpay refund id so repeated webhooks don't create duplicate entries.
 */
const upsertRazorpayPaymentRefund = async (
  razorpayPaymentId: string,
  refundId: string | undefined,
  amountPaise: number,
  status: 'created' | 'processed' | 'failed',
  reason?: string
): Promise<void> => {
  const record = await RazorpayPayment.findOne({ paymentId: razorpayPaymentId });
  if (!record) return;

  const existing = refundId
    ? record.refunds.find((r) => r.refundId === refundId)
    : undefined;

  if (existing) {
    existing.status = status;
    existing.amount = amountPaise;
    if (reason) existing.reason = reason;
  } else {
    record.refunds.push({
      refundId: refundId || '',
      amount: amountPaise,
      status,
      reason,
      createdAt: new Date(),
    });
  }

  const refundedPaise = record.refunds
    .filter((r) => r.status === 'processed')
    .reduce((sum, r) => sum + r.amount, 0);

  record.amountRefunded = refundedPaise;

  if (refundedPaise >= record.amount && record.amount > 0) {
    record.status = 'refunded';
  } else if (refundedPaise > 0) {
    record.status = 'partially_refunded';
  }

  await record.save();
};

interface RequestRefundParams {
  orderId: string;
  userId: string;
  reason?: string;
  notes?: string;
}

/**
 * User-initiated refund request. Validates ownership/eligibility, creates a
 * Refund record in `requested` state and flags the order as `requested`.
 */
export const requestRefund = async (params: RequestRefundParams): Promise<IRefund> => {
  const { orderId, userId, reason, notes } = params;

  const order = await Order.findById(orderId);
  if (!order) {
    throw new RefundError('Order not found', 404);
  }

  if (order.userId.toString() !== userId) {
    throw new RefundError('You are not authorized to request a refund for this order', 403);
  }

  if (order.paymentMethod !== 'online') {
    throw new RefundError('Refunds are only available for online payments', 400);
  }

  if (order.paymentStatus !== 'completed') {
    throw new RefundError('Refund can only be requested for completed payments', 400);
  }

  if (order.refundStatus === 'refunded' || order.refundedAmount >= order.totalAmount) {
    throw new RefundError('Order has already been fully refunded', 400);
  }

  const razorpayPaymentId = getRazorpayPaymentId(order);
  if (!razorpayPaymentId) {
    throw new RefundError('No Razorpay payment found for this order', 400);
  }

  // Prevent stacking duplicate open requests for the same order.
  const openRefund = await Refund.findOne({
    orderId: order._id,
    status: { $in: ['requested', 'approved'] },
  });
  if (openRefund) {
    throw new RefundError('A refund request is already in progress for this order', 409);
  }

  // A customer request is always for the full remaining (refundable) balance.
  const refundableAmount = await calculateRemainingRefundableAmount(
    order._id,
    order.totalAmount
  );
  if (refundableAmount <= 0) {
    throw new RefundError('There is no refundable amount left on this order', 400);
  }

  const refund = await Refund.create({
    orderId: order._id,
    userId: order.userId,
    razorpayPaymentId,
    amount: refundableAmount,
    currency: getOrderCurrency(order),
    reason,
    notes,
    status: 'requested',
    requestedAt: new Date(),
  });

  order.refundStatus = 'requested';
  await order.save();

  return refund;
};

/**
 * Submit an already-persisted refund record to the Razorpay refund API and
 * reconcile our records. Shared by the approve flow and the admin direct-refund
 * (partial) flow. On gateway failure the refund is marked `failed` and a
 * RefundError(502) is thrown.
 */
const submitRefundToRazorpay = async (
  refund: IRefund,
  order: IOrder
): Promise<IRefund> => {
  const razorpayPaymentId = refund.razorpayPaymentId;
  const amountPaise = toPaise(refund.amount);

  let razorpayRefund: any;
  try {
    razorpayRefund = await razorpay.payments.refund(razorpayPaymentId, {
      amount: amountPaise,
      notes: {
        orderId: order._id.toString(),
        refundId: refund._id.toString(),
        reason: refund.reason || 'Customer refund',
      },
    });
  } catch (error: any) {
    // Gateway rejected the refund — mark the record so it can be retried/inspected.
    console.error(
      `[refund] Razorpay refund failed for payment ${razorpayPaymentId}:`,
      error?.error?.description || error?.message || error
    );
    refund.status = 'failed';
    await refund.save();
    await recalcOrderRefundState(order._id);
    throw new RefundError(
      error?.error?.description || error?.message || 'Razorpay refund request failed',
      502
    );
  }

  refund.razorpayRefundId = razorpayRefund?.id;
  refund.razorpayResponse = razorpayRefund;
  if (razorpayRefund?.currency) refund.currency = razorpayRefund.currency;

  // Razorpay returns 'processed' for instant refunds, otherwise 'pending'/'created'.
  if (razorpayRefund?.status === 'processed') {
    refund.status = 'processed';
    refund.processedAt = new Date();
  } else {
    refund.status = 'approved';
  }

  await refund.save();

  await upsertRazorpayPaymentRefund(
    razorpayPaymentId,
    razorpayRefund?.id,
    typeof razorpayRefund?.amount === 'number' ? razorpayRefund.amount : amountPaise,
    refund.status === 'processed' ? 'processed' : 'created',
    refund.reason
  );

  await recalcOrderRefundState(order._id);

  return refund;
};

/**
 * Admin-initiated approval of an existing (customer) refund request. Calls the
 * Razorpay refund API, persists the gateway refund id and reconciles records.
 */
export const approveRefund = async (
  refundId: string,
  adminNotes?: string
): Promise<IRefund> => {
  const refund = await Refund.findById(refundId);
  if (!refund) {
    throw new RefundError('Refund not found', 404);
  }

  if (refund.status !== 'requested') {
    throw new RefundError(`Refund cannot be approved while in '${refund.status}' state`, 400);
  }

  const order = await Order.findById(refund.orderId);
  if (!order) {
    throw new RefundError('Order not found for this refund', 404);
  }

  if (order.paymentMethod !== 'online') {
    throw new RefundError('Refunds are only available for online payments', 400);
  }

  if (!refund.razorpayPaymentId && !getRazorpayPaymentId(order)) {
    throw new RefundError('No Razorpay payment id available to process the refund', 400);
  }
  if (!refund.razorpayPaymentId) {
    refund.razorpayPaymentId = getRazorpayPaymentId(order) as string;
  }

  if (adminNotes) refund.notes = adminNotes;

  return submitRefundToRazorpay(refund, order);
};

interface AdminRefundParams {
  orderId: string;
  amount?: number;
  reason?: string;
  notes?: string;
}

/**
 * Admin-initiated refund for a custom amount (supports partial + multiple
 * refunds). When `amount` is omitted the full remaining balance is refunded.
 * Validates the amount against the remaining refundable balance, then submits
 * to Razorpay immediately.
 */
export const createAdminRefund = async (params: AdminRefundParams): Promise<IRefund> => {
  const { orderId, amount, reason, notes } = params;

  const order = await Order.findById(orderId);
  if (!order) {
    throw new RefundError('Order not found', 404);
  }

  if (order.paymentMethod !== 'online') {
    throw new RefundError('Refunds are only available for online payments', 400);
  }

  if (order.paymentStatus !== 'completed') {
    throw new RefundError('Refund can only be issued for completed payments', 400);
  }

  const razorpayPaymentId = getRazorpayPaymentId(order);
  if (!razorpayPaymentId) {
    throw new RefundError('No Razorpay payment found for this order', 400);
  }

  const remaining = await calculateRemainingRefundableAmount(order._id, order.totalAmount);
  if (remaining <= 0) {
    throw new RefundError('Order has already been fully refunded', 400);
  }

  // Default to a full refund of the remaining balance when no amount is given.
  const refundAmount = amount === undefined ? remaining : amount;
  validateRefundAmount(refundAmount, remaining);

  const refund = await Refund.create({
    orderId: order._id,
    userId: order.userId,
    razorpayPaymentId,
    amount: refundAmount,
    currency: getOrderCurrency(order),
    reason,
    notes,
    status: 'requested',
    requestedAt: new Date(),
  });

  return submitRefundToRazorpay(refund, order);
};

type RefundWebhookEvent =
  | 'refund.created'
  | 'refund.processed'
  | 'refund.failed';

/**
 * Reconcile our records from a Razorpay refund webhook. Idempotent: safe to
 * receive the same event more than once.
 */
export const handleRefundWebhookEvent = async (
  event: RefundWebhookEvent,
  refundEntity: any
): Promise<void> => {
  if (!refundEntity?.id) return;

  const gatewayRefundId: string = refundEntity.id;
  const razorpayPaymentId: string | undefined = refundEntity.payment_id;
  const amountPaise: number =
    typeof refundEntity.amount === 'number' ? refundEntity.amount : 0;

  // Match by gateway refund id first; fall back to an in-flight refund on the
  // same payment (e.g. refund initiated through our approve flow before the id
  // round-trip completed).
  let refund = await Refund.findOne({ razorpayRefundId: gatewayRefundId });

  if (!refund && razorpayPaymentId) {
    refund = await Refund.findOne({
      razorpayPaymentId,
      status: { $in: ['approved', 'requested'] },
    }).sort({ createdAt: -1 });

    if (refund) {
      refund.razorpayRefundId = gatewayRefundId;
    }
  }

  if (!refund) {
    // Nothing to reconcile (refund not tracked by us); still mirror onto the
    // RazorpayPayment table if we can identify the payment.
    if (razorpayPaymentId) {
      const mappedStatus =
        event === 'refund.processed'
          ? 'processed'
          : event === 'refund.failed'
          ? 'failed'
          : 'created';
      await upsertRazorpayPaymentRefund(
        razorpayPaymentId,
        gatewayRefundId,
        amountPaise,
        mappedStatus
      );
    }
    return;
  }

  // Idempotency: refunds reaching a terminal state should not be reprocessed if
  // the same (or an out-of-order/duplicate) webhook arrives again.
  if (refund.status === 'processed' && event !== 'refund.failed') {
    return;
  }
  if (refund.status === 'failed' && event === 'refund.failed') {
    return;
  }

  switch (event) {
    case 'refund.created':
      if (refund.status === 'requested') refund.status = 'approved';
      break;
    case 'refund.processed':
      refund.status = 'processed';
      refund.processedAt = new Date();
      break;
    case 'refund.failed':
      refund.status = 'failed';
      break;
  }

  refund.razorpayResponse = refundEntity;
  await refund.save();

  await upsertRazorpayPaymentRefund(
    refund.razorpayPaymentId,
    gatewayRefundId,
    amountPaise || toPaise(refund.amount),
    event === 'refund.processed'
      ? 'processed'
      : event === 'refund.failed'
      ? 'failed'
      : 'created',
    refund.reason
  );

  await recalcOrderRefundState(refund.orderId);
};

/**
 * Auto-create a refund request when an online, paid order is cancelled.
 * No-op for COD/unpaid/already-refunded orders. Returns the created refund (if any).
 */
export const autoRequestRefundForCancelledOrder = async (
  order: IOrder
): Promise<IRefund | null> => {
  if (order.paymentMethod !== 'online') return null;
  if (order.paymentStatus !== 'completed') return null;
  if (order.refundStatus === 'refunded' || order.refundedAmount >= order.totalAmount) {
    return null;
  }

  const razorpayPaymentId = getRazorpayPaymentId(order);
  if (!razorpayPaymentId) return null;

  const openRefund = await Refund.findOne({
    orderId: order._id,
    status: { $in: ['requested', 'approved'] },
  });
  if (openRefund) {
    // Already flagged; just make sure the order reflects it.
    if (order.refundStatus === 'none') {
      order.refundStatus = 'requested';
      await order.save();
    }
    return openRefund;
  }

  const refundableAmount = await calculateRemainingRefundableAmount(
    order._id,
    order.totalAmount
  );
  if (refundableAmount <= 0) return null;

  const refund = await Refund.create({
    orderId: order._id,
    userId: order.userId,
    razorpayPaymentId,
    amount: refundableAmount,
    currency: getOrderCurrency(order),
    reason: 'Order cancelled',
    status: 'requested',
    requestedAt: new Date(),
  });

  order.refundStatus = 'requested';
  await order.save();

  return refund;
};
