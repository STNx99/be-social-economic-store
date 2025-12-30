import { z } from "zod";
import { CartSchema } from "../cart";
import { IDSchema } from "../common";
import { createEndpointResponseSchema, BaseResponseSchema } from "../responses/common";

export const AddToCartRequestSchema = z.object({
  productId: IDSchema,
  quantity: z.number().int().positive().default(1),
});

export const AddToCartResponseSchema = createEndpointResponseSchema(CartSchema);

export const GetCartRequestSchema = z.object({
  userId: IDSchema,
});

export const GetCartResponseSchema = createEndpointResponseSchema(CartSchema);

export const UpdateCartItemRequestSchema = z.object({
  productId: IDSchema,
  quantity: z.number().int().positive(),
});

export const UpdateCartItemResponseSchema = createEndpointResponseSchema(CartSchema);

export const RemoveFromCartRequestSchema = z.object({
  productId: IDSchema,
});

export const RemoveFromCartResponseSchema = createEndpointResponseSchema(CartSchema);

export const ClearCartRequestSchema = z.object({
  userId: IDSchema,
});

export const ClearCartResponseSchema = BaseResponseSchema;

export type AddToCartRequest = z.infer<typeof AddToCartRequestSchema>;
export type AddToCartResponse = z.infer<typeof AddToCartResponseSchema>;
export type GetCartRequest = z.infer<typeof GetCartRequestSchema>;
export type GetCartResponse = z.infer<typeof GetCartResponseSchema>;
export type UpdateCartItemRequest = z.infer<typeof UpdateCartItemRequestSchema>;
export type UpdateCartItemResponse = z.infer<typeof UpdateCartItemResponseSchema>;
export type RemoveFromCartRequest = z.infer<typeof RemoveFromCartRequestSchema>;
export type RemoveFromCartResponse = z.infer<typeof RemoveFromCartResponseSchema>;
export type ClearCartRequest = z.infer<typeof ClearCartRequestSchema>;
export type ClearCartResponse = z.infer<typeof ClearCartResponseSchema>;
