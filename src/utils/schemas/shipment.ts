import { z } from 'zod';
import { NonEmptyStringSchema } from './common';
import { 
  BaseEntityFields, 
  entityDateRefinement, 
  atLeastOneFieldRefinement, 
  createIdParamSchema 
} from './entity';

export const ShipmentStatusSchema = z.enum([
  'pending',
  'processing',
  'shipped',
  'in_transit',
  'delivered',
  'failed',
  'returned'
]);

export const ShipmentSchema = z.object({
  ...BaseEntityFields,
  orderId: NonEmptyStringSchema,
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  status: ShipmentStatusSchema.default('pending'),
  estimatedDelivery: z.string().optional(),
  actualDelivery: z.string().optional(),
  shippingAddress: NonEmptyStringSchema,
}).refine(...entityDateRefinement);

export const CreateShipmentSchema = z.object({
  orderId: NonEmptyStringSchema,
  shippingAddress: NonEmptyStringSchema,
  carrier: z.string().optional(),
});

export const UpdateShipmentSchema = z.object({
  status: ShipmentStatusSchema.optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  actualDelivery: z.string().optional(),
}).refine(...atLeastOneFieldRefinement);

export const ShipmentIdParamSchema = createIdParamSchema();

export type ShipmentStatus = z.infer<typeof ShipmentStatusSchema>;
export type Shipment = z.infer<typeof ShipmentSchema>;
export type CreateShipmentInput = z.infer<typeof CreateShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof UpdateShipmentSchema>;
export type ShipmentIdParams = z.infer<typeof ShipmentIdParamSchema>;