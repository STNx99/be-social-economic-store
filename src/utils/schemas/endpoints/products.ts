import { z } from "zod";
import { ProductSchema } from "../product";

export const CreateProductRequestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  images: z.array(z.string().url()).default([]),
  category: z.string().max(100).optional(),
  status: z.enum(['active', 'inactive', 'out_of_stock']).optional().default('active'),
});

export const CreateProductResponseSchema = z.object({
  success: z.boolean(),
  data: ProductSchema.optional(),
  error: z.string().optional(),
  details: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});

export const GetProductRequestSchema = z.object({
  id: z.string().uuid(),
});

export const GetProductResponseSchema = z.object({
  success: z.boolean(),
  data: ProductSchema.optional(),
  error: z.string().optional(),
  details: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});

export const UpdateProductRequestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  images: z.array(z.string().url()).optional(),
  category: z.string().max(100).optional(),
  status: z.enum(['active', 'inactive', 'out_of_stock']).optional(),
});

export const UpdateProductResponseSchema = z.object({
  success: z.boolean(),
  data: ProductSchema.optional(),
  error: z.string().optional(),
  details: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});

export const DeleteProductRequestSchema = z.object({
  id: z.string().uuid(),
});

export const DeleteProductResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  details: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});

export const ListProductsRequestSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  category: z.string().optional(),
  status: z.enum(['active', 'inactive', 'out_of_stock']).optional(),
  search: z.string().optional(),
});

export const ListProductsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ProductSchema).optional(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }).optional(),
  error: z.string().optional(),
});

export const GeneratePresignedUrlRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
});

export const GeneratePresignedUrlResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    url: z.string().url(),
    key: z.string(),
    expiresIn: z.number(),
  }).optional(),
  error: z.string().optional(),
});

export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;
export type CreateProductResponse = z.infer<typeof CreateProductResponseSchema>;
export type GetProductRequest = z.infer<typeof GetProductRequestSchema>;
export type GetProductResponse = z.infer<typeof GetProductResponseSchema>;
export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;
export type UpdateProductResponse = z.infer<typeof UpdateProductResponseSchema>;
export type DeleteProductRequest = z.infer<typeof DeleteProductRequestSchema>;
export type DeleteProductResponse = z.infer<typeof DeleteProductResponseSchema>;
export type ListProductsRequest = z.infer<typeof ListProductsRequestSchema>;
export type ListProductsResponse = z.infer<typeof ListProductsResponseSchema>;
export type GeneratePresignedUrlRequest = z.infer<typeof GeneratePresignedUrlRequestSchema>;
export type GeneratePresignedUrlResponse = z.infer<typeof GeneratePresignedUrlResponseSchema>;






