import { z } from 'zod';

// User Registration Schema
export const registerUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    savedAddresses: z.array(
      z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        isDefault: z.boolean().default(false),
      })
    ).optional(),
  }),
});

// User Login Schema
export const loginUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
    password: z.string().min(1, 'Password is required'),
  }).superRefine((data, ctx) => {
    // Check if at least one of email or phone is provided
    if (!data.email && !data.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either email or phone number is required',
        path: ['email'],
      });
    }
  }),
});

// Update User Profile Schema
export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().min(10).optional(),
    savedAddresses: z.array(
      z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        isDefault: z.boolean().default(false),
      })
    ).optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  }),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Add Saved Address Schema
export const addSavedAddressSchema = z.object({
  body: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'Zip code is required'),
    country: z.string().min(1, 'Country is required'),
    isDefault: z.boolean().optional(),
  }),
  params: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  }),
});

// Update Saved Address Schema
export const updateSavedAddressSchema = z.object({
  body: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    isDefault: z.boolean().optional(),
  }),
  params: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
    addressId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid address ID'),
  }),
});

// Get/Delete Saved Address Schema
export const savedAddressParamsSchema = z.object({
  params: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
    addressId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid address ID').optional(),
  }),
});

export type AddSavedAddressInput = z.infer<typeof addSavedAddressSchema>;
export type UpdateSavedAddressInput = z.infer<typeof updateSavedAddressSchema>;
