import { z } from "zod";
import { 
  ProductVariantSchema, 
  CreateProductVariantSchema, 
  UpdateProductVariantSchema, 
  ProductVariantIdParamSchema 
} from "../productVariant";
import { createEndpointResponseSchema, BaseResponseSchema } from "../responses/common";

/**
 * Response schema for product variant operations
 */
export const ProductVariantResponseSchema = createEndpointResponseSchema(ProductVariantSchema);

/**
 * Schema for creating a new product variant via API
 */
export const CreateProductVariantRequestSchema = CreateProductVariantSchema;

/**
 * Response schema for product variant creation
 */
export const CreateProductVariantResponseSchema = ProductVariantResponseSchema;

/**
 * Schema for getting a product variant by ID via API
 */
export const GetProductVariantRequestSchema = ProductVariantIdParamSchema;

/**
 * Response schema for getting a product variant
 */
export const GetProductVariantResponseSchema = ProductVariantResponseSchema;

/**
 * Schema for updating a product variant via API
 */
export const UpdateProductVariantRequestSchema = UpdateProductVariantSchema;

/**
 * Response schema for product variant update
 */
export const UpdateProductVariantResponseSchema = ProductVariantResponseSchema;

/**
 * Schema for deleting a product variant via API
 */
export const DeleteProductVariantRequestSchema = ProductVariantIdParamSchema;

/**
 * Response schema for product variant deletion
 */
export const DeleteProductVariantResponseSchema = BaseResponseSchema;

/**
 * Schema for listing product variants for a product
 */
export const ListProductVariantsRequestSchema = z.object({
  productId: z.string().min(1),
});

/**
 * Response schema for listing product variants
 */
export const ListProductVariantsResponseSchema = createEndpointResponseSchema(z.array(ProductVariantSchema));

// Type exports
export type CreateProductVariantRequest = z.infer<typeof CreateProductVariantRequestSchema>;
export type CreateProductVariantResponse = z.infer<typeof CreateProductVariantResponseSchema>;
export type GetProductVariantRequest = z.infer<typeof GetProductVariantRequestSchema>;
export type GetProductVariantResponse = z.infer<typeof GetProductVariantResponseSchema>;
export type UpdateProductVariantRequest = z.infer<typeof UpdateProductVariantRequestSchema>;
export type UpdateProductVariantResponse = z.infer<typeof UpdateProductVariantResponseSchema>;
export type DeleteProductVariantRequest = z.infer<typeof DeleteProductVariantRequestSchema>;
export type DeleteProductVariantResponse = z.infer<typeof DeleteProductVariantResponseSchema>;
export type ListProductVariantsRequest = z.infer<typeof ListProductVariantsRequestSchema>;
export type ListProductVariantsResponse = z.infer<typeof ListProductVariantsResponseSchema>;