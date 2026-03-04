import mongoose, { Schema, Document } from 'mongoose';

export type RefundStatus = 'requested' | 'approved' | 'processed' | 'failed';

export interface IRefund extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  razorpayPaymentId: string;
  razorpayRefundId?: string;
  amount: number;
  currency: string;
  reason?: string;
  status: RefundStatus;
  notes?: string;
  // Raw refund entity returned by Razorpay (API call or webhook), kept for audit.
  razorpayResponse?: Record<string, unknown>;
  requestedAt: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RefundSchema: Schema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      required: [true, 'Razorpay payment ID is required'],
      trim: true,
      index: true,
    },
    razorpayRefundId: {
      type: String,
      trim: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Refund amount is required'],
      min: [0, 'Refund amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    razorpayResponse: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['requested', 'approved', 'processed', 'failed'],
      default: 'requested',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

RefundSchema.index({ createdAt: -1 });

export default mongoose.model<IRefund>('Refund', RefundSchema);
