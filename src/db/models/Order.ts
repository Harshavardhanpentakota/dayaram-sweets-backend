import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  weight: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface IRazorPayDetails {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number;
  currency: string;
  userId: mongoose.Types.ObjectId;
}

export interface IOrder extends Document {
  orderNumber: string;
  invoice_id: number;
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
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
  status: 'pending' | 'accepted' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'cod' | 'online' | 'card' | 'upi' | 'wallet';
  refundStatus: 'none' | 'requested' | 'processing' | 'refunded' | 'partially_refunded' | 'failed';
  refundedAmount: number;
  shippingCost: number;
  tax: number;
  discount: number;
  notes?: string;
  deliveryDate?: Date;
  razorpayDetails?: IRazorPayDetails;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    invoice_id: {
      type: Number,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
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
    status: {
      type: String,
      enum: ['pending', 'accepted', 'delivered', 'cancelled'],
      default: 'pending',
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
    refundStatus: {
      type: String,
      enum: ['none', 'requested', 'processing', 'refunded', 'partially_refunded', 'failed'],
      default: 'none',
    },
    refundedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Refunded amount cannot be negative'],
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
    notes: {
      type: String,
      trim: true,
    },
    deliveryDate: {
      type: Date,
    },
    razorpayDetails: {
      razorpay_order_id: {
        type: String,
        trim: true,
      },
      razorpay_payment_id: {
        type: String,
        trim: true,
      },
      razorpay_signature: {
        type: String,
        trim: true,
      },
      amount: {
        type: Number,
      },
      currency: {
        type: String,
        uppercase: true,
        trim: true,
      },
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate order number
OrderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD${Date.now()}${count + 1}`;
  }
  next();
});

// Indexes for faster queries
OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ refundStatus: 1 });
OrderSchema.index({ createdAt: -1 });

export default mongoose.model<IOrder>('Order', OrderSchema);
