import { z } from "zod";
import { CategorySchema } from "../category";

export const CreateCategoryRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  slug: z.string().max(100).optional(),
});

export const CreateCategoryResponseSchema = z.object({
  success: z.boolean(),
  data: CategorySchema.optional(),
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

export const GetCategoryRequestSchema = z.object({
  id: z.string().uuid(),
});

export const GetCategoryResponseSchema = z.object({
  success: z.boolean(),
  data: CategorySchema.optional(),
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

export const UpdateCategoryRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  slug: z.string().max(100).optional(),
});

export const UpdateCategoryResponseSchema = z.object({
  success: z.boolean(),
  data: CategorySchema.optional(),
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

export const DeleteCategoryRequestSchema = z.object({
  id: z.string().uuid(),
});

export const DeleteCategoryResponseSchema = z.object({
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

export const ListCategoriesRequestSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
});

export const ListCategoriesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(CategorySchema).optional(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }).optional(),
  error: z.string().optional(),
});

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

