import { z } from 'zod';

// Create Payment Schema
export const createPaymentSchema = z.object({
  body: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
    orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID'),
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().length(3, 'Currency must be 3 characters').optional(),
    paymentMethod: z.enum(['cod', 'online', 'card', 'upi', 'wallet']),
    paymentGateway: z.string().optional(),
    metadata: z.object({
      gatewayTransactionId: z.string().optional(),
      gatewayResponse: z.any().optional(),
      cardLast4: z.string().length(4).optional(),
      upiId: z.string().email().optional(),
      walletProvider: z.string().optional(),
    }).optional(),
    notes: z.string().optional(),
  }),
});

// Update Payment Status Schema
export const updatePaymentStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'success', 'failed', 'refunded']),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment ID'),
  }),
});

// Get Payment by ID Schema
export const getPaymentByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment ID'),
  }),
});

// Get Payments by Order Schema
export const getPaymentsByOrderSchema = z.object({
  params: z.object({
    orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID'),
  }),
});

export const createRazorpayOrderSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be greater than 0'),
    currency: z.string().length(3, 'Currency must be 3 characters').optional(),
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional(),
    orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID').optional(),
    receipt: z.string().min(3).max(40).optional(),
    notes: z.record(z.string()).optional(),
  }),
});

export const verifyRazorpayPaymentSchema = z.object({
  body: z.object({
    razorpay_order_id: z.string().min(1, 'razorpay_order_id is required'),
    razorpay_payment_id: z.string().min(1, 'razorpay_payment_id is required'),
    razorpay_signature: z.string().min(1, 'razorpay_signature is required'),
    amount: z.number().positive('Amount must be greater than 0').optional(),
    currency: z.string().length(3, 'Currency must be 3 characters').optional(),
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional(),
  }),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
export type CreateRazorpayOrderInput = z.infer<typeof createRazorpayOrderSchema>;
export type VerifyRazorpayPaymentInput = z.infer<typeof verifyRazorpayPaymentSchema>;
