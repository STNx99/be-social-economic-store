import { z } from "zod";
import { CartSchema, CartItemSchema } from "../cart";

export const AddToCartRequestSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
});

export const AddToCartResponseSchema = z.object({
  success: z.boolean(),
  data: CartSchema.optional(),
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

export const GetCartRequestSchema = z.object({
  userId: z.string().uuid(),
});

export const GetCartResponseSchema = z.object({
  success: z.boolean(),
  data: CartSchema.optional(),
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

export const UpdateCartItemRequestSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
});

export const UpdateCartItemResponseSchema = z.object({
  success: z.boolean(),
  data: CartSchema.optional(),
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

export const RemoveFromCartRequestSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
});

export const RemoveFromCartResponseSchema = z.object({
  success: z.boolean(),
  data: CartSchema.optional(),
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

export const ClearCartRequestSchema = z.object({
  userId: z.string().uuid(),
});

export const ClearCartResponseSchema = z.object({
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

