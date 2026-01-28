import { z } from 'zod';

// Create Product Schema
export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters').max(200),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    category: z.enum(['sweets', 'namkeen', 'dry-fruits', 'gift-boxes', 'seasonal', 'other']),
    price: z.number().positive('Price must be positive'),
    originalPrice: z.number().positive().optional(),
    discount: z.number().min(0).max(100).optional(),
    stock: z.number().int().min(0, 'Stock cannot be negative'),
    images: z.array(z.string().url('Invalid image URL')).optional(),
    weight: z.string().optional(),
    ingredients: z.array(z.string()).optional(),
    nutritionalInfo: z.object({
      calories: z.number().min(0).optional(),
      protein: z.number().min(0).optional(),
      carbohydrates: z.number().min(0).optional(),
      fat: z.number().min(0).optional(),
      sugar: z.number().min(0).optional(),
    }).optional(),
    tags: z.array(z.string()).optional(),
    isFeatured: z.boolean().optional(),
  }),
});

// Update Product Schema
export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(200).optional(),
    description: z.string().min(10).optional(),
    category: z.enum(['sweets', 'namkeen', 'dry-fruits', 'gift-boxes', 'seasonal', 'other']).optional(),
    price: z.number().positive().optional(),
    originalPrice: z.number().positive().optional(),
    discount: z.number().min(0).max(100).optional(),
    stock: z.number().int().min(0).optional(),
    images: z.array(z.string().url()).optional(),
    weight: z.string().optional(),
    ingredients: z.array(z.string()).optional(),
    nutritionalInfo: z.object({
      calories: z.number().min(0).optional(),
      protein: z.number().min(0).optional(),
      carbohydrates: z.number().min(0).optional(),
      fat: z.number().min(0).optional(),
      sugar: z.number().min(0).optional(),
    }).optional(),
    tags: z.array(z.string()).optional(),
    isFeatured: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  }),
});

// Get Product by ID Schema
export const getProductByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  }),
});

// Get Products by Category Schema
export const getProductsByCategorySchema = z.object({
  params: z.object({
    category: z.enum(['sweets', 'namkeen', 'dry-fruits', 'gift-boxes', 'seasonal', 'other']),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// Search Products Schema
export const searchProductsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.enum(['sweets', 'namkeen', 'dry-fruits', 'gift-boxes', 'seasonal', 'other']).optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    isBestSeller: z.enum(['true', 'false']).optional(),
    isNewArrival: z.enum(['true', 'false']).optional(),
    sort: z.enum(['createdAt', 'price', 'name', 'ratings.average']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export type SearchProductsInput = z.infer<typeof searchProductsSchema>;
