import { z } from "zod";
import { IDSchema, DateSchema } from "./common";
import { BaseEntityFields, entityDateRefinement } from "./entity";

export const CartItemSchema = z.object({
  productId: IDSchema,
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  image: z.string().url().optional(),
});

export const CartSchema = z.object({
  ...BaseEntityFields,
  userId: IDSchema,
  items: z.array(CartItemSchema),
  total: z.number().min(0),
}).refine(...entityDateRefinement);

export type CartItem = z.infer<typeof CartItemSchema>;
export type Cart = z.infer<typeof CartSchema>;
