import { z } from "zod";
import { ProductSchema } from "../product";
import { IDSchema, PositiveNumberSchema, URLSchema } from "../common";
import { createEndpointResponseSchema, BaseResponseSchema } from "../responses/common";

const productStatusEnum = z.enum(['active', 'inactive', 'out_of_stock', 'pending', 'rejected', 'archived', 'draft']);

/**
 * Schema for creating a new product via API
 */
export const CreateProductRequestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: PositiveNumberSchema,
  stock: z.number().int().min(0),
  images: z.array(URLSchema).default([]),
  category: z.string().max(100).optional(),
  status: productStatusEnum.optional().default('pending'),
  variants: z.array(z.object({
    name: z.string().min(1).max(200),
    sku: z.string().min(1).max(100),
    price: PositiveNumberSchema,
    stock: z.number().int().min(0),
    attributes: z.record(z.string(), z.any()),
    imageUrl: URLSchema.optional(),
  })).optional().default([]),
});

/**
 * Response schema for product creation
 */
export const CreateProductResponseSchema = createEndpointResponseSchema(ProductSchema);

/**
 * Schema for getting a product by ID via API
 */
export const GetProductRequestSchema = z.object({
  id: IDSchema,
});

/**
 * Response schema for getting a product
 */
export const GetProductResponseSchema = createEndpointResponseSchema(ProductSchema);

/**
 * Schema for updating a product via API
 */
export const UpdateProductRequestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  price: PositiveNumberSchema.optional(),
  stock: z.number().int().min(0).optional(),
  images: z.array(URLSchema).optional(),
  category: z.string().max(100).optional(),
  status: productStatusEnum.optional(),
  variants: z.array(z.object({
    id: IDSchema.optional(),
    name: z.string().min(1).max(200).optional(),
    sku: z.string().min(1).max(100).optional(),
    price: PositiveNumberSchema.optional(),
    stock: z.number().int().min(0).optional(),
    attributes: z.record(z.string(), z.any()).optional(),
    imageUrl: URLSchema.optional(),
  })).optional(),
});

/**
 * Response schema for product update
 */
export const UpdateProductResponseSchema = createEndpointResponseSchema(ProductSchema);

/**
 * Schema for deleting a product via API
 */
export const DeleteProductRequestSchema = z.object({
  id: IDSchema,
});

/**
 * Response schema for product deletion
 */
export const DeleteProductResponseSchema = BaseResponseSchema;

/**
 * Schema for listing products with filters and pagination
 */
export const ListProductsRequestSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  category: z.string().optional(),
  status: productStatusEnum.optional(),
  search: z.string().optional(),
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

/**
 * Response schema for listing products
 */
export const ListProductsResponseSchema = BaseResponseSchema.extend({
  data: z.array(ProductSchema).optional(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }).optional(),
});

/**
 * Schema for generating a presigned URL for product images
 */
export const GeneratePresignedUrlRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
});

/**
 * Response schema for presigned URL generation
 */
export const GeneratePresignedUrlResponseSchema = createEndpointResponseSchema(
  z.object({
    url: z.string().url(),
    key: z.string(),
    expiresIn: z.number(),
  })
);

// Type exports
export type ProductStatus = z.infer<typeof productStatusEnum>;
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