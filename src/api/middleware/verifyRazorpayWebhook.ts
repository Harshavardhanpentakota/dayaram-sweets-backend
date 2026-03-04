import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';

export const verifyRazorpayWebhook = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!webhookSecret) {
      res.status(500).json({ message: 'Webhook secret is not configured' });
      return;
    }

    if (!signature || Array.isArray(signature)) {
      res.status(400).json({ message: 'Missing Razorpay webhook signature' });
      return;
    }

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      res.status(401).json({ message: 'Invalid webhook signature' });
      return;
    }

    req.body = JSON.parse(rawBody);
    next();
  } catch {
    res.status(400).json({ message: 'Invalid webhook payload' });
  }
};
