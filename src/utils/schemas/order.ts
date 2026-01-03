import { z } from 'zod';
import { PositiveNumberSchema, NonEmptyStringSchema } from './common';
import { 
  BaseEntityFields, 
  entityDateRefinement, 
  atLeastOneFieldRefinement, 
  createIdParamSchema 
} from './entity';

export const OrderItemSchema = z.object({
  productId: NonEmptyStringSchema,
  variantId: z.string().optional(),
  name: NonEmptyStringSchema,
  price: PositiveNumberSchema,
  quantity: z.number().int().positive(),
});

export const OrderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
]);

export const PaymentStatusSchema = z.enum([
  'pending',
  'paid',
  'failed',
  'refunded'
]);

export const OrderSchema = z.object({
  ...BaseEntityFields,
  customerId: NonEmptyStringSchema,
  sellerId: NonEmptyStringSchema,
  cartId: NonEmptyStringSchema,
  items: z.array(OrderItemSchema).min(1, 'Order must have at least one item'),
  totalAmount: PositiveNumberSchema,
  status: OrderStatusSchema.default('pending'),
  paymentStatus: PaymentStatusSchema.default('pending'),
  shippingAddress: NonEmptyStringSchema,
  notes: z.string().max(500).optional(),
}).refine(...entityDateRefinement);

export const CreateOrderSchema = z.object({
  customerId: NonEmptyStringSchema,
  sellerId: NonEmptyStringSchema,
  cartId: NonEmptyStringSchema,
  items: z.array(OrderItemSchema).min(1),
  totalAmount: PositiveNumberSchema,
  shippingAddress: NonEmptyStringSchema,
  notes: z.string().max(500).optional(),
});

export const UpdateOrderSchema = z.object({
  status: OrderStatusSchema.optional(),
  paymentStatus: PaymentStatusSchema.optional(),
  shippingAddress: NonEmptyStringSchema.optional(),
  notes: z.string().max(500).optional(),
}).refine(...atLeastOneFieldRefinement);

export const OrderIdParamSchema = createIdParamSchema();

export type OrderItem = z.infer<typeof OrderItemSchema>;
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;
export type OrderIdParams = z.infer<typeof OrderIdParamSchema>;