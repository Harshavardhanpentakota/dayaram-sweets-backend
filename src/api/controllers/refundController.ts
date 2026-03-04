import { Request, Response } from 'express';
import Refund from '../../db/models/Refund';
import {
  requestRefund,
  approveRefund,
  createAdminRefund,
  RefundError,
} from '../services/refundService';

/**
 * Map a thrown error to an HTTP response. RefundError carries its own status
 * code; anything else is treated as an unexpected server error.
 */
const sendError = (res: Response, error: any): void => {
  if (error instanceof RefundError) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: error?.message || 'Unknown error',
  });
};

// POST /api/refunds/request
export const createRefundRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, userId, reason, notes } = req.body;

    const refund = await requestRefund({ orderId, userId, reason, notes });

    res.status(201).json({
      success: true,
      message: 'Refund request created successfully',
      refund,
    });
  } catch (error) {
    sendError(res, error);
  }
};

// GET /api/refunds/:refundId
export const getRefundById = async (req: Request, res: Response): Promise<void> => {
  try {
    const refund = await Refund.findById(req.params.refundId)
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber totalAmount status paymentStatus refundStatus');

    if (!refund) {
      res.status(404).json({ success: false, message: 'Refund not found' });
      return;
    }

    res.status(200).json({ success: true, refund });
  } catch (error) {
    sendError(res, error);
  }
};

// POST /api/admin/refunds  (admin issues a refund directly — custom/partial amount)
export const createAdminRefundRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, amount, reason, notes } = req.body;

    const refund = await createAdminRefund({ orderId, amount, reason, notes });

    res.status(201).json({
      success: true,
      message: 'Refund created and submitted to Razorpay',
      refundId: refund.razorpayRefundId,
      refund,
    });
  } catch (error) {
    sendError(res, error);
  }
};

// POST /api/admin/refunds/:refundId/approve
export const approveRefundRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { notes } = req.body || {};

    const refund = await approveRefund(req.params.refundId, notes);

    res.status(200).json({
      success: true,
      message: 'Refund approved and submitted to Razorpay',
      refund,
    });
  } catch (error) {
    sendError(res, error);
  }
};

// GET /api/admin/refunds  (admin listing — supports optional ?status filter)
export const getAllRefunds = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: Record<string, unknown> = {};
    if (typeof status === 'string' && status.length > 0) {
      filter.status = status;
    }

    const refunds = await Refund.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber totalAmount status paymentStatus refundStatus');

    res.status(200).json({ success: true, count: refunds.length, refunds });
  } catch (error) {
    sendError(res, error);
  }
};
