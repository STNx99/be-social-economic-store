import { z } from 'zod';
import { PositiveNumberSchema, NonEmptyStringSchema, URLSchema, IDSchema } from './common';
import { 
  BaseEntityFields, 
  entityDateRefinement, 
  atLeastOneFieldRefinement, 
  createIdParamSchema 
} from './entity';

/**
 * ProductVariant entity schema with validation rules
 */
export const ProductVariantSchema = z.object({
  ...BaseEntityFields,
  productId: IDSchema,
  sku: NonEmptyStringSchema.max(100, 'SKU must be less than 100 characters'),
  name: NonEmptyStringSchema.max(200, 'Variant name must be less than 200 characters'),
  price: PositiveNumberSchema,
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  attributes: z.record(z.string(), z.any()).optional().default({}),
  imageUrl: URLSchema.optional(),
  isActive: z.boolean().default(true),
}).refine(...entityDateRefinement);

/**
 * Schema for validating product variant creation input
 */
export const CreateProductVariantSchema = z.object({
  productId: IDSchema,
  sku: NonEmptyStringSchema.max(100, 'SKU must be less than 100 characters'),
  name: NonEmptyStringSchema.max(200, 'Variant name must be less than 200 characters'),
  price: PositiveNumberSchema,
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  attributes: z.record(z.string(), z.any()).optional().default({}),
  imageUrl: URLSchema.optional(),
  isActive: z.boolean().optional().default(true)
});

/**
 * Schema for validating product variant update input
 */
export const UpdateProductVariantSchema = z.object({
  sku: NonEmptyStringSchema.max(100, 'SKU must be less than 100 characters').optional(),
  name: NonEmptyStringSchema.max(200, 'Variant name must be less than 200 characters').optional(),
  price: PositiveNumberSchema.optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  attributes: z.record(z.string(), z.any()).optional(),
  imageUrl: URLSchema.optional(),
  isActive: z.boolean().optional()
}).refine(...atLeastOneFieldRefinement);

/**
 * Schema for validating product variant ID parameters
 */
export const ProductVariantIdParamSchema = createIdParamSchema();

export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type CreateProductVariantInput = z.infer<typeof CreateProductVariantSchema>;
export type UpdateProductVariantInput = z.infer<typeof UpdateProductVariantSchema>;
export type ProductVariantIdParams = z.infer<typeof ProductVariantIdParamSchema>;