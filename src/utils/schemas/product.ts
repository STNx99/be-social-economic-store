import { z } from 'zod';
import { 
  IDSchema, 
  DateSchema, 
  PositiveNumberSchema, 
  NonEmptyStringSchema, 
  URLSchema,
  createIdParamSchema 
} from '@/utils/schemas/common';


export const ProductSchema = z.object({
  id: IDSchema,
  name: NonEmptyStringSchema.max(200, 'Product name must be less than 200 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  price: PositiveNumberSchema,
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  images: z.array(URLSchema).default([]),
  category: NonEmptyStringSchema.max(100, 'Category must be less than 100 characters').optional(),
  status: z.enum(['active', 'inactive', 'out_of_stock', 'pending', 'rejected']).default('active'),
  createdAt: DateSchema,
  updatedAt: DateSchema
}).refine(
  (product) => product.updatedAt >= product.createdAt,
  {
    message: 'Updated date cannot be before creation date',
    path: ['updatedAt']
  }
);


export const CreateProductSchema = z.object({
  name: NonEmptyStringSchema.max(200, 'Product name must be less than 200 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  price: PositiveNumberSchema,
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  images: z.array(URLSchema).default([]),
  category: NonEmptyStringSchema.max(100, 'Category must be less than 100 characters').optional(),
  status: z.enum(['active', 'inactive', 'out_of_stock', 'pending', 'rejected']).optional().default('active')
});

export const UpdateProductSchema = z.object({
  name: NonEmptyStringSchema.max(200, 'Product name must be less than 200 characters').optional(),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  price: PositiveNumberSchema.optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  images: z.array(URLSchema).optional(),
  category: NonEmptyStringSchema.max(100, 'Category must be less than 100 characters').optional(),
  status: z.enum(['active', 'inactive', 'out_of_stock', 'pending', 'rejected']).optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided for update'
);

export const ProductInputSchema = z.object({
  name: NonEmptyStringSchema.max(200),
  description: z.string().max(2000).optional(),
  price: PositiveNumberSchema,
  stock: z.number().int().min(0),
  images: z.array(URLSchema).optional().default([]),
  category: z.string().max(100).optional(),
  status: z.enum(['active', 'inactive', 'out_of_stock', 'pending', 'rejected']).optional().default('active')
});

export const SanitizedProductInputSchema = ProductInputSchema.transform((data) => ({
  name: data.name.trim(),
  description: data.description?.trim(),
  price: data.price,
  stock: data.stock,
  images: Array.isArray(data.images) ? data.images : [],
  category: data.category?.trim() || undefined,
  status: data.status || 'active'
}));

export const ProductIdParamSchema = createIdParamSchema();

export type Product = z.infer<typeof ProductSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductInput = z.infer<typeof ProductInputSchema>;
export type SanitizedProductInput = z.infer<typeof SanitizedProductInputSchema>;
export type ProductIdParams = z.infer<typeof ProductIdParamSchema>;