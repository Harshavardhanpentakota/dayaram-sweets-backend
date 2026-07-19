import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  weight: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface IInvoice extends Document {
  invoice_id: number;
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  invoiceDate: Date;
  items: IInvoiceItem[];
  totalAmount: number;
  shippingAddress: {
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress?: {
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  shippingCost: number;
  tax: number;
  discount: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'cod' | 'online' | 'card' | 'upi' | 'wallet';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema: Schema = new Schema(
  {
    invoice_id: {
      type: Number,
      required: true,
      unique: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required'],
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        weight: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1'],
        },
        price: {
          type: Number,
          required: true,
          min: [0, 'Price cannot be negative'],
        },
        subtotal: {
          type: Number,
          required: true,
          min: [0, 'Subtotal cannot be negative'],
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    billingAddress: {
      name: { type: String },
      phone: { type: String },
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String },
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: [0, 'Shipping cost cannot be negative'],
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'online', 'card', 'upi', 'wallet'],
      required: [true, 'Payment method is required'],
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

// Indexes for faster queries
InvoiceSchema.index({ userId: 1 });
InvoiceSchema.index({ createdAt: -1 });

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);
