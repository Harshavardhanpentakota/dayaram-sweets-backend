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

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
