import mongoose, { Schema } from 'mongoose';

export interface IProduct {
  productId?: string;
  name: string;
  description: string;
  category: string;
  collection: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  images: string[];
  weight?: string;
  ingredients?: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    sugar?: number;
  };
  tags: string[];
  isActive: boolean;
  isBestSeller: boolean;
  ratings: {
    average: number;
    count: number;  
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    productId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Andhra Sweets',
        'Cashew Sweets',
        'Bengali Sweets',
        'Khoya Sweets',
        'Laddu Sweets',
        'Milk Sweets',
        'Home Foods',
        'Category Unspecified',
      ],
      default: 'Category Unspecified',
    },
    collection: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
    },
    discount: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
      default: 0,
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    images: [{
      type: String,
      trim: true,
    }],
    weight: {
      type: String,
      trim: true,
    },
    ingredients: [{
      type: String,
      trim: true,
    }],
    nutritionalInfo: {
      calories: { type: Number, min: 0 },
      protein: { type: Number, min: 0 },
      carbohydrates: { type: Number, min: 0 },
      fat: { type: Number, min: 0 },
      sugar: { type: Number, min: 0 },
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be less than 0'],
        max: [5, 'Rating cannot exceed 5'],
      },
      count: {
        type: Number,
        default: 0,
        min: [0, 'Count cannot be negative'],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ isBestSeller: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ productId: 1 }, { unique: true, sparse: true });

export default mongoose.model<IProduct>('Product', ProductSchema);
