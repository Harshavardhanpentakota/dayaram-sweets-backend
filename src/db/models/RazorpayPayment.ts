import mongoose, { Document, Schema } from 'mongoose';

export interface IRazorpayRefundEntry {
  refundId: string;
  amount: number;
  status: 'created' | 'processed' | 'failed';
  reason?: string;
  createdAt: Date;
}

export interface IRazorpayPayment extends Document {
  orderId: string;
  paymentId?: string;
  amount: number;
  status:
    | 'created'
    | 'authorized'
    | 'captured'
    | 'verified'
    | 'failed'
    | 'refunded'
    | 'partially_refunded';
  userId?: mongoose.Types.ObjectId;
  currency: string;
  refunds: IRazorpayRefundEntry[];
  amountRefunded: number;
  createdAt: Date;
  updatedAt: Date;
}

const RazorpayPaymentSchema = new Schema<IRazorpayPayment>(
  {
    orderId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    paymentId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be greater than 0'],
    },
    status: {
      type: String,
      enum: [
        'created',
        'authorized',
        'captured',
        'verified',
        'failed',
        'refunded',
        'partially_refunded',
      ],
      default: 'created',
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    // Refunds issued against this payment. Amounts are stored in paise to match `amount`.
    refunds: [
      {
        refundId: {
          type: String,
          trim: true,
        },
        amount: {
          type: Number,
          min: [0, 'Refund amount cannot be negative'],
        },
        status: {
          type: String,
          enum: ['created', 'processed', 'failed'],
          default: 'created',
        },
        reason: {
          type: String,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    amountRefunded: {
      type: Number,
      default: 0,
      min: [0, 'Refunded amount cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IRazorpayPayment>('RazorpayPayment', RazorpayPaymentSchema);
