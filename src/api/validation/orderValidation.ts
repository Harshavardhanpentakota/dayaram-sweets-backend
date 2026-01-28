import { z } from 'zod';

// Order Item Schema
const orderItemSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  name: z.string().min(1),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  price: z.number().positive('Price must be positive'),
  subtotal: z.number().min(0),
});

// Address Schema
const addressSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Phone number is required'),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  country: z.string().min(1, 'Country is required'),
});

// Create Order Schema
export const createOrderSchema = z.object({
  body: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
    items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
    totalAmount: z.number().positive('Total amount must be positive'),
    shippingAddress: addressSchema,
    billingAddress: addressSchema.optional(),
    paymentMethod: z.enum(['cod', 'online', 'card', 'upi', 'wallet']),
    shippingCost: z.number().min(0).optional(),
    tax: z.number().min(0).optional(),
    discount: z.number().min(0).optional(),
    notes: z.string().optional(),
    deliveryDate: z.string().datetime().optional().or(z.date().optional()),
  }),
});

// Update Order Status Schema
export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID'),
  }),
});

// Get Order by ID Schema
export const getOrderByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID'),
  }),
});

// Get User Orders Schema
export const getUserOrdersSchema = z.object({
  params: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
