import { z } from "zod";
import { CategorySchema } from "../category";
import { IDSchema } from "../common";
import { createEndpointResponseSchema, BaseResponseSchema } from "../responses/common";

/**
 * Schema for creating a new category via API
 */
export const CreateCategoryRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  slug: z.string().max(100).optional(),
});

/**
 * Response schema for category creation
 */
export const CreateCategoryResponseSchema = createEndpointResponseSchema(CategorySchema);

/**
 * Schema for getting a category by ID via API
 */
export const GetCategoryRequestSchema = z.object({
  id: IDSchema,
});

/**
 * Response schema for getting a category
 */
export const GetCategoryResponseSchema = createEndpointResponseSchema(CategorySchema);

/**
 * Schema for updating a category via API
 */
export const UpdateCategoryRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  slug: z.string().max(100).optional(),
});

/**
 * Response schema for category update
 */
export const UpdateCategoryResponseSchema = createEndpointResponseSchema(CategorySchema);

/**
 * Schema for deleting a category via API
 */
export const DeleteCategoryRequestSchema = z.object({
  id: IDSchema,
});

/**
 * Response schema for category deletion
 */
export const DeleteCategoryResponseSchema = BaseResponseSchema;

/**
 * Schema for listing categories with pagination
 */
export const ListCategoriesRequestSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
});

/**
 * Response schema for listing categories
 */
export const ListCategoriesResponseSchema = BaseResponseSchema.extend({
  data: z.array(CategorySchema).optional(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }).optional(),
});

// Type exports
export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequestSchema>;
export type CreateCategoryResponse = z.infer<typeof CreateCategoryResponseSchema>;
export type GetCategoryRequest = z.infer<typeof GetCategoryRequestSchema>;
export type GetCategoryResponse = z.infer<typeof GetCategoryResponseSchema>;
export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequestSchema>;
export type UpdateCategoryResponse = z.infer<typeof UpdateCategoryResponseSchema>;
export type DeleteCategoryRequest = z.infer<typeof DeleteCategoryRequestSchema>;
export type DeleteCategoryResponse = z.infer<typeof DeleteCategoryResponseSchema>;
export type ListCategoriesRequest = z.infer<typeof ListCategoriesRequestSchema>;
export type ListCategoriesResponse = z.infer<typeof ListCategoriesResponseSchema>;