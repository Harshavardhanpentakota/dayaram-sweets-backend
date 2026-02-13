import { z } from 'zod';

// Admin Login Schema
export const adminLoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

// Create Admin Schema
export const createAdminSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(50),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['super-admin', 'admin', 'manager', 'staff']).optional().default('staff'),
    accessRights: z.object({
      read: z.boolean(),
      write: z.boolean(),
    }).optional(),
    permissions: z.object({
      manageProducts: z.boolean().optional(),
      manageOrders: z.boolean().optional(),
      manageUsers: z.boolean().optional(),
      manageAdmins: z.boolean().optional(),
      manageSettings: z.boolean().optional(),
      manageCoupons: z.boolean().optional(),
      viewReports: z.boolean().optional(),
    }).optional(),
  }),
});

// Update Admin Schema
export const updateAdminSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(50).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['super-admin', 'admin', 'manager', 'staff']).optional(),
    accessRights: z.object({
      read: z.boolean(),
      write: z.boolean(),
    }).optional(),
    permissions: z.object({
      manageProducts: z.boolean().optional(),
      manageOrders: z.boolean().optional(),
      manageUsers: z.boolean().optional(),
      manageAdmins: z.boolean().optional(),
      manageSettings: z.boolean().optional(),
      manageCoupons: z.boolean().optional(),
      viewReports: z.boolean().optional(),
    }).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    adminId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid admin ID'),
  }),
});

// Get Admin by ID Schema
export const getAdminByIdSchema = z.object({
  params: z.object({
    adminId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid admin ID'),
  }),
});

// Get Admins Query Schema
export const getAdminsQuerySchema = z.object({
  query: z.object({
    isActive: z.enum(['true', 'false']).optional(),
    role: z.enum(['super-admin', 'admin', 'manager', 'staff']).optional(),
  }),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
