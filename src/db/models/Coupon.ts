import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount?: number;
  usageLimit: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  applicableCategories?: string[];
  applicableProducts?: mongoose.Types.ObjectId[];
  excludedProducts?: mongoose.Types.ObjectId[];
  firstOrderOnly: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Discount type is required'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order value cannot be negative'],
    },
    maxDiscountAmount: {
      type: Number,
      min: [0, 'Maximum discount amount cannot be negative'],
    },
    usageLimit: {
      type: Number,
      default: 1,
      min: [1, 'Usage limit must be at least 1'],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, 'Used count cannot be negative'],
    },
    validFrom: {
      type: Date,
      required: [true, 'Valid from date is required'],
    },
    validUntil: {
      type: Date,
      required: [true, 'Valid until date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    applicableCategories: [{
      type: String,
      enum: ['sweets', 'namkeen', 'dry-fruits', 'gift-boxes', 'seasonal', 'other'],
    }],
    applicableProducts: [{
      type: Schema.Types.ObjectId,
      ref: 'Product',
    }],
    excludedProducts: [{
      type: Schema.Types.ObjectId,
      ref: 'Product',
    }],
    firstOrderOnly: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
CouponSchema.index({ code: 1 });
CouponSchema.index({ isActive: 1 });
CouponSchema.index({ validFrom: 1, validUntil: 1 });

// Validation: validUntil must be after validFrom
CouponSchema.pre('save', function (this: ICoupon, next) {
  if (this.validUntil <= this.validFrom) {
    next(new Error('Valid until date must be after valid from date'));
  }
  
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    next(new Error('Percentage discount cannot exceed 100%'));
  }
  
  next();
});

export default mongoose.model<ICoupon>('Coupon', CouponSchema);
