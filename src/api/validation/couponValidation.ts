import { z } from 'zod';

// Create Coupon Schema
export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3, 'Coupon code must be at least 3 characters').max(20).toUpperCase(),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().min(0, 'Discount value cannot be negative'),
    minOrderValue: z.number().min(0, 'Minimum order value cannot be negative').default(0),
    maxDiscountAmount: z.number().min(0).optional(),
    usageLimit: z.number().min(1, 'Usage limit must be at least 1').default(1),
    validFrom: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    validUntil: z.string().or(z.date()).transform((val) => new Date(val)),
    isActive: z.boolean().optional().default(true),
    applicableCategories: z.array(
      z.enum(['sweets', 'namkeen', 'dry-fruits', 'gift-boxes', 'seasonal', 'other'])
    ).optional(),
    applicableProducts: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
    excludedProducts: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
    firstOrderOnly: z.boolean().optional().default(false),
  }).refine(
    (data) => data.discountType !== 'percentage' || data.discountValue <= 100,
    { message: 'Percentage discount cannot exceed 100%', path: ['discountValue'] }
  ),
});

// Update Coupon Schema
export const updateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(20).toUpperCase().optional(),
    description: z.string().min(10).optional(),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    discountValue: z.number().min(0).optional(),
    minOrderValue: z.number().min(0).optional(),
    maxDiscountAmount: z.number().min(0).optional(),
    usageLimit: z.number().min(1).optional(),
    validFrom: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    validUntil: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    isActive: z.boolean().optional(),
    applicableCategories: z.array(
      z.enum(['sweets', 'namkeen', 'dry-fruits', 'gift-boxes', 'seasonal', 'other'])
    ).optional(),
    applicableProducts: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
    excludedProducts: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
    firstOrderOnly: z.boolean().optional(),
  }),
  params: z.object({
    code: z.string().min(1, 'Coupon code is required'),
  }),
});

// Validate Coupon Schema
export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3, 'Coupon code is required'),
    orderValue: z.number().min(0, 'Order value must be positive'),
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional(),
    category: z.enum(['sweets', 'namkeen', 'dry-fruits', 'gift-boxes', 'seasonal', 'other']).optional(),
    productIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  }),
});

// Get Coupon by Code Schema
export const getCouponByCodeSchema = z.object({
  params: z.object({
    code: z.string().min(1, 'Coupon code is required'),
  }),
});

// Get Coupons Query Schema
export const getCouponsQuerySchema = z.object({
  query: z.object({
    isActive: z.enum(['true', 'false']).optional(),
    sortBy: z.enum(['createdAt', 'validFrom', 'validUntil', 'usedCount', 'code']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
