import { z } from 'zod';
import { IDSchema, DateSchema, NonEmptyStringSchema, PositiveNumberSchema } from '@/utils/schemas/common';

export const CartItemSchema = z.object({
  productId: IDSchema,
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  price: PositiveNumberSchema,
  name: NonEmptyStringSchema,
});

export const CartSchema = z.object({
  id: IDSchema,
  userId: IDSchema,
  items: z.array(CartItemSchema).default([]),
  total: z.number().min(0, 'Total cannot be negative').default(0),
  createdAt: DateSchema,
  updatedAt: DateSchema
}).refine(
  (cart) => cart.updatedAt >= cart.createdAt,
  {
    message: 'Updated date cannot be before created date',
    path: ['updatedAt']
  }
);

export const AddToCartRequestSchema = z.object({
  productId: IDSchema,
  quantity: z.number().int().positive('Quantity must be greater than 0'),
});

export const UpdateCartItemSchema = z.object({
  productId: IDSchema,
  quantity: z.number().int().positive('Quantity must be greater than 0'),
});

export const RemoveFromCartRequestSchema = z.object({
  productId: IDSchema,
});

export const CartIdParamSchema = z.object({
  id: IDSchema
});

export const UserIdParamSchema = z.object({
  userId: IDSchema
});

export type CartItem = z.infer<typeof CartItemSchema>;
export type Cart = z.infer<typeof CartSchema>;
export type AddToCartRequest = z.infer<typeof AddToCartRequestSchema>;
export type UpdateCartItemRequest = z.infer<typeof UpdateCartItemSchema>;
export type RemoveFromCartRequest = z.infer<typeof RemoveFromCartRequestSchema>;
export type CartIdParams = z.infer<typeof CartIdParamSchema>;
export type UserIdParams = z.infer<typeof UserIdParamSchema>;

