import { z } from 'zod';

// Request a refund (user-facing)
export const requestRefundSchema = z.object({
  body: z.object({
    orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID'),
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
    reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
    notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  }),
});

// Get refund by ID
export const getRefundByIdSchema = z.object({
  params: z.object({
    refundId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid refund ID'),
  }),
});

// Admin direct refund — custom amount, supports partial + multiple refunds.
// `amount` is in rupees; omit it to refund the full remaining balance.
export const createAdminRefundSchema = z.object({
  body: z.object({
    orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID'),
    amount: z.number().positive('Refund amount must be greater than 0').optional(),
    reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
    notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  }),
});

// Approve refund (admin)
export const approveRefundSchema = z.object({
  params: z.object({
    refundId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid refund ID'),
  }),
  body: z.object({
    notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  }),
});

export type RequestRefundInput = z.infer<typeof requestRefundSchema>;
export type GetRefundByIdInput = z.infer<typeof getRefundByIdSchema>;
export type CreateAdminRefundInput = z.infer<typeof createAdminRefundSchema>;
export type ApproveRefundInput = z.infer<typeof approveRefundSchema>;
