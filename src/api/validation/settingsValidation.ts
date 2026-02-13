import { z } from 'zod';

// Create Setting Schema
export const createSettingSchema = z.object({
  body: z.object({
    key: z.string().min(2, 'Key must be at least 2 characters'),
    value: z.any(),
    type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
    category: z.enum(['delivery', 'payment', 'general', 'taxes', 'other']),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

// Update Setting Schema
export const updateSettingSchema = z.object({
  body: z.object({
    value: z.any().optional(),
    type: z.enum(['string', 'number', 'boolean', 'object', 'array']).optional(),
    category: z.enum(['delivery', 'payment', 'general', 'taxes', 'other']).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    key: z.string().min(1, 'Key is required'),
  }),
});

// Update Multiple Settings Schema
export const updateMultipleSettingsSchema = z.object({
  body: z.object({
    settings: z.array(
      z.object({
        key: z.string(),
        value: z.any(),
      })
    ),
  }),
});

// Get Setting by Key Schema
export const getSettingByKeySchema = z.object({
  params: z.object({
    key: z.string().min(1, 'Key is required'),
  }),
});

// Get Settings Query Schema
export const getSettingsQuerySchema = z.object({
  query: z.object({
    category: z.enum(['delivery', 'payment', 'general', 'taxes', 'other']).optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),
});

export type CreateSettingInput = z.infer<typeof createSettingSchema>;
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
export type UpdateMultipleSettingsInput = z.infer<typeof updateMultipleSettingsSchema>;
