import { z } from "zod";
import { PositiveNumberSchema, NonEmptyStringSchema, URLSchema } from "./common";
import { ProductVariantSchema } from "./productVariant";
import {
  BaseEntityFields,
  entityDateRefinement,
  atLeastOneFieldRefinement,
  createIdParamSchema,
} from "./entity";

/**
 * Product entity schema with validation rules
 */
export const ProductSchema = z
  .object({
    ...BaseEntityFields,
    sellerId: NonEmptyStringSchema,
    name: NonEmptyStringSchema.max(200, "Product name must be less than 200 characters"),
    description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
    price: PositiveNumberSchema,
    stock: z.number().int().min(0, "Stock cannot be negative"),
    images: z.array(URLSchema).default([]),
    category: NonEmptyStringSchema.max(100, "Category must be less than 100 characters").optional(),
    status: z
      .enum(["active", "inactive", "out_of_stock", "pending", "rejected", "archived", "draft"])
      .default("pending"),
    variants: z.array(ProductVariantSchema).optional().default([]),
  })
  .refine(...entityDateRefinement);

/**
 * Schema for validating product creation input
 */
export const CreateProductSchema = z.object({
  sellerId: NonEmptyStringSchema,
  name: NonEmptyStringSchema.max(200, "Product name must be less than 200 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  price: PositiveNumberSchema,
  stock: z.number().int().min(0, "Stock cannot be negative"),
  images: z.array(URLSchema).default([]),
  category: NonEmptyStringSchema.max(100, "Category must be less than 100 characters").optional(),
  status: z
    .enum(["active", "inactive", "out_of_stock", "pending", "rejected", "archived", "draft"])
    .optional()
    .default("pending"),
  variants: z.array(ProductVariantSchema).optional().default([]),
});

/**
 * Schema for validating product update input (at least one field required)
 */
export const UpdateProductSchema = z
  .object({
    sellerId: NonEmptyStringSchema.optional(),
    name: NonEmptyStringSchema.max(200, "Product name must be less than 200 characters").optional(),
    description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
    price: PositiveNumberSchema.optional(),
    stock: z.number().int().min(0, "Stock cannot be negative").optional(),
    images: z.array(URLSchema).optional(),
    category: NonEmptyStringSchema.max(100, "Category must be less than 100 characters").optional(),
    status: z
      .enum(["active", "inactive", "out_of_stock", "pending", "rejected", "archived", "draft"])
      .optional(),
    variants: z.array(ProductVariantSchema).optional(),
  })
  .refine(...atLeastOneFieldRefinement);

/**
 * Raw product input schema for API validation
 */
export const ProductInputSchema = z.object({
  sellerId: NonEmptyStringSchema,
  name: NonEmptyStringSchema.max(200),
  description: z.string().max(2000).optional(),
  price: PositiveNumberSchema,
  stock: z.number().int().min(0),
  images: z.array(URLSchema).optional().default([]),
  category: z.string().max(100).optional(),
  status: z
    .enum(["active", "inactive", "out_of_stock", "pending", "rejected", "archived", "draft"])
    .optional()
    .default("pending"),
  variants: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        sku: z.string().min(1).max(100),
        price: PositiveNumberSchema,
        stock: z.number().int().min(0),
        attributes: z.record(z.string(), z.any()).optional().default({}),
        imageUrl: URLSchema.optional(),
      }),
    )
    .optional()
    .default([]),
});

export const SanitizedProductInputSchema = ProductInputSchema.transform((data) => ({
  sellerId: data.sellerId.trim(),
  name: data.name.trim(),
  description: data.description?.trim(),
  price: data.price,
  stock: data.stock,
  images: Array.isArray(data.images) ? data.images : [],
  category: data.category?.trim() || undefined,
  status: data.status || "pending",
  variants: data.variants.map((v) => ({
    ...v,
    name: v.name.trim(),
    sku: v.sku.trim(),
    attributes: v.attributes || {},
  })),
}));

/**
 * Schema for validating product ID parameters
 */
export const ProductIdParamSchema = createIdParamSchema();

export type Product = z.infer<typeof ProductSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductInput = z.infer<typeof ProductInputSchema>;
export type SanitizedProductInput = z.infer<typeof SanitizedProductInputSchema>;
export type ProductIdParams = z.infer<typeof ProductIdParamSchema>;