import { z } from "zod";
import { NonEmptyStringSchema } from "./common";
import {
  BaseEntityFields,
  entityDateRefinement,
  atLeastOneFieldRefinement,
  createIdParamSchema,
} from "./entity";

/**
 * Category entity schema with validation rules
 */
export const CategorySchema = z
  .object({
    ...BaseEntityFields,
    name: NonEmptyStringSchema.max(
      100,
      "Category name must be less than 100 characters",
    ),
    description: z
      .string()
      .max(500, "Description must be less than 500 characters")
      .optional(),
    slug: NonEmptyStringSchema.max(
      100,
      "Slug must be less than 100 characters",
    ),
  })
  .refine(...entityDateRefinement);

/**
 * Schema for validating category creation input
 */
export const CreateCategorySchema = z.object({
  name: NonEmptyStringSchema.max(
    100,
    "Category name must be less than 100 characters",
  ),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  slug: NonEmptyStringSchema.max(
    100,
    "Slug must be less than 100 characters",
  ).optional(),
});

/**
 * Schema for validating category update input (at least one field required)
 */
export const UpdateCategorySchema = z
  .object({
    name: NonEmptyStringSchema.max(
      100,
      "Category name must be less than 100 characters",
    ).optional(),
    description: z
      .string()
      .max(500, "Description must be less than 500 characters")
      .optional(),
    slug: NonEmptyStringSchema.max(
      100,
      "Slug must be less than 100 characters",
    ).optional(),
  })
  .refine(...atLeastOneFieldRefinement);

/**
 * Raw category input schema for API validation
 */
export const CategoryInputSchema = z.object({
  name: NonEmptyStringSchema.max(100),
  description: z.string().max(500).optional(),
  slug: NonEmptyStringSchema.max(100).optional(),
});

/**
 * Sanitized category input schema with data transformation
 */
export const SanitizedCategoryInputSchema = CategoryInputSchema.transform(
  (data) => {
    const trimmedName = data.name.trim();
    const slugFromSlug = data.slug
      ?.trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const slugFromName = trimmedName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const finalSlug =
      slugFromSlug && slugFromSlug.length > 0 ? slugFromSlug : slugFromName;

    return {
      name: trimmedName,
      description: data.description?.trim(),
      slug: finalSlug,
    };
  },
);

/**
 * Schema for validating category ID parameters
 */
export const CategoryIdParamSchema = createIdParamSchema();

// Type exports
export type Category = z.infer<typeof CategorySchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type CategoryInput = z.infer<typeof CategoryInputSchema>;
export type SanitizedCategoryInput = z.infer<
  typeof SanitizedCategoryInputSchema
>;
export type CategoryIdParams = z.infer<typeof CategoryIdParamSchema>;