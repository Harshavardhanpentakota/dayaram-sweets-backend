import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  transactionId: string;
  userId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: 'cod' | 'online' | 'card' | 'upi' | 'wallet';
  paymentGateway?: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  paymentDate?: Date;
  refundDate?: Date;
  metadata?: {
    gatewayTransactionId?: string;
    gatewayResponse?: any;
    cardLast4?: string;
    upiId?: string;
    walletProvider?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'online', 'card', 'upi', 'wallet'],
      required: [true, 'Payment method is required'],
    },
    paymentGateway: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentDate: {
      type: Date,
    },
    refundDate: {
      type: Date,
    },
    metadata: {
      gatewayTransactionId: { type: String },
      gatewayResponse: { type: Schema.Types.Mixed },
      cardLast4: { type: String },
      upiId: { type: String },
      walletProvider: { type: String },
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate transaction ID
PaymentSchema.pre('save', async function (next) {
  if (this.isNew && !this.transactionId) {
    const count = await mongoose.model('Payment').countDocuments();
    this.transactionId = `TXN${Date.now()}${count + 1}`;
  }
  next();
});

// Indexes for faster queries
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ paymentDate: -1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
