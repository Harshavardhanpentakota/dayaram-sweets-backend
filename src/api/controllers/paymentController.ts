import { Request, Response } from 'express';
import crypto from 'crypto';
import Payment from '../../db/models/Payment';
import RazorpayPayment from '../../db/models/RazorpayPayment';
import Order from '../../db/models/Order';
import { razorpay, razorpayPublicConfig } from '../../config/razorpay';
import { handleRefundWebhookEvent } from '../services/refundService';

export const createPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const payment = await Payment.create(req.body);
    res.status(201).json({ message: 'Payment created successfully', payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getAllPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const payments = await Payment.find()
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber totalAmount');
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
     
export const getPaymentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const payment = await Payment.findById(req.params.id )
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber totalAmount');
    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getPaymentsByOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const payments = await Payment.find({ orderId: req.params.orderId })
      .populate('userId', 'name email');
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }
    res.status(200).json({ message: 'Payment status updated successfully', payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createRazorpayOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, currency = 'INR', userId, receipt, notes } = req.body;

    // Order creation must happen in backend so pricing and order amount cannot be tampered on the client.
    const amountInPaise = Math.round(Number(amount) * 100);

    if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
      res.status(400).json({ message: 'Invalid amount. Amount must be greater than 0.' });
      return;
    }

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes,
    });

    await RazorpayPayment.create({
      orderId: order.id,
      amount: order.amount,
      status: 'created',
      userId,
      currency: order.currency,
    });

    res.status(201).json({
      success: true,
      keyId: razorpayPublicConfig.keyId,
      orderId: order.id,
      order,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Unable to create Razorpay order',
      error: error?.message || 'Unknown error',
    });
  }
};

export const verifyRazorpayPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      currency = 'INR',
      userId,
    } = req.body;

    // Secret key must never be exposed to frontend because anyone with it can forge trusted payment signatures.
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      res.status(500).json({ success: false, message: 'Razorpay secret key is not configured' });
      return;
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    // Signature verification is critical to ensure the payment callback is genuinely from Razorpay.
    if (expectedSignature !== razorpay_signature) {
      await RazorpayPayment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        {
          paymentId: razorpay_payment_id,
          status: 'failed',
          userId,
          ...(amount ? { amount: Math.round(Number(amount) * 100) } : {}),
          currency,
        },
        { upsert: true, new: true }
      );

      res.status(400).json({ success: false, message: 'Payment verification failed' });
      return;
    }

    await RazorpayPayment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        paymentId: razorpay_payment_id,
        status: 'verified',
        userId,
        ...(amount ? { amount: Math.round(Number(amount) * 100) } : {}),
        currency,
      },
      { upsert: true, new: true }
    );

    // Capture the payment so it can later be refunded. If auto-capture is off in
    // the Razorpay account the payment stays `authorized` after success, and
    // refunds require a `captured` payment. We capture the EXACT authorized
    // amount/currency returned by the gateway (partial capture is not enabled),
    // which avoids the "Capture amount must be equal to the amount authorized"
    // error. Best-effort: a capture failure is logged but does not fail
    // verification (the signature is already validated).
    try {
      const rzpPayment: any = await razorpay.payments.fetch(razorpay_payment_id);

      if (rzpPayment?.status === 'authorized') {
        await razorpay.payments.capture(
          razorpay_payment_id,
          rzpPayment.amount,
          rzpPayment.currency || currency || 'INR'
        );
        await RazorpayPayment.findOneAndUpdate(
          { orderId: razorpay_order_id },
          { status: 'captured', amount: rzpPayment.amount },
          { new: true }
        );
      } else if (rzpPayment?.status === 'captured') {
        await RazorpayPayment.findOneAndUpdate(
          { orderId: razorpay_order_id },
          { status: 'captured' },
          { new: true }
        );
      }
    } catch (captureError: any) {
      console.error(
        `[payment] Capture failed for ${razorpay_payment_id}:`,
        captureError?.error?.description || captureError?.message || captureError
      );
    }

    // Find the order by razorpay_order_id stored in razorPayDetails
    // const order = await Order.findOne({
    //   'razorPayDetails.razorpay_order_id': razorpay_order_id,
    // });

    // if (!order) {
    //   res.status(400).json({
    //     success: false,
    //     message: 'Order not found for this Razorpay order ID',
    //   });
    //   return;
    // }

    // Create payment entry in Payment table
    const paymentData = {
      transactionId: `TXN${Date.now()}`,
      userId,
      // orderId: order._id,
      amount: amount ? Math.round(Number(amount) * 100) : 0,
      currency,
      paymentMethod: 'online',
      paymentGateway: 'razorpay',
      status: 'success',
      paymentDate: new Date(),
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    };

    await Payment.findOneAndUpdate(
      { razorpay_order_id },
      paymentData,
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Unable to verify payment',
      error: error?.message || 'Unknown error',
    });
  }
};

export const handleRazorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = req.body;

    if (event?.event === 'payment.captured') {
      const paymentEntity = event.payload?.payment?.entity;

      await RazorpayPayment.findOneAndUpdate(
        { orderId: paymentEntity.order_id },
        {
          paymentId: paymentEntity.id,
          amount: paymentEntity.amount,
          currency: paymentEntity.currency || 'INR',
          status: 'captured',
        },
        { upsert: true, new: true }
      );
    }

    if (
      event?.event === 'refund.created' ||
      event?.event === 'refund.processed' ||
      event?.event === 'refund.failed'
    ) {
      const refundEntity = event.payload?.refund?.entity;
      await handleRefundWebhookEvent(event.event, refundEntity);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Unable to process webhook',
      error: error?.message || 'Unknown error',
    });
  }
};
