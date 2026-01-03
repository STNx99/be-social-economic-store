import { z } from "zod";
import { OrderSchema, OrderStatusSchema, OrderItemSchema } from "../order";
import { PaymentMethodSchema } from "../payment";
import { IDSchema, PositiveNumberSchema } from "../common";
import { createEndpointResponseSchema } from "../responses/common";

export const CreateOrderRequestSchema = z.object({
  sellerId: z.string().min(1),
  items: z.array(OrderItemSchema).min(1),
  totalAmount: PositiveNumberSchema,
  shippingAddress: z.string().min(1),
  notes: z.string().max(500).optional(),
});

export const CreateOrderResponseSchema = createEndpointResponseSchema(OrderSchema);

export const GetOrderRequestSchema = z.object({
  id: IDSchema,
});

export const GetOrderResponseSchema = createEndpointResponseSchema(OrderSchema);

export const UpdateOrderStatusRequestSchema = z.object({
  status: OrderStatusSchema,
});

export const UpdateOrderStatusResponseSchema = createEndpointResponseSchema(OrderSchema);

export const ListOrdersResponseSchema = createEndpointResponseSchema(z.array(OrderSchema));

export const CheckoutRequestSchema = z.object({
  cartId: IDSchema,
  shippingAddress: z.string().min(1),
  paymentMethod: PaymentMethodSchema,
  notes: z.string().max(500).optional(),
});

export const CheckoutResponseSchema = createEndpointResponseSchema(OrderSchema);

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;
export type CreateOrderResponse = z.infer<typeof CreateOrderResponseSchema>;
export type GetOrderRequest = z.infer<typeof GetOrderRequestSchema>;
export type GetOrderResponse = z.infer<typeof GetOrderResponseSchema>;
export type UpdateOrderStatusRequest = z.infer<typeof UpdateOrderStatusRequestSchema>;
export type UpdateOrderStatusResponse = z.infer<typeof UpdateOrderStatusResponseSchema>;
export type ListOrdersResponse = z.infer<typeof ListOrdersResponseSchema>;
export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;
export type CheckoutResponse = z.infer<typeof CheckoutResponseSchema>;