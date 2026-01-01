import { z } from 'zod';
import { IDSchema, NonEmptyStringSchema } from './common';

/**
 * Inventory status types
 */
export const InventoryStatusSchema = z.enum(['in_stock', 'low_stock', 'out_of_stock']);

/**
 * Inventory movement types
 */
export const InventoryMovementTypeSchema = z.enum(['in', 'out']);

/**
 * Inventory movement reasons
 */
export const InventoryMovementReasonSchema = z.enum(['purchase', 'sale', 'return', 'adjustment', 'damaged']);

/**
 * Inventory item schema
 */
export const InventoryItemSchema = z.object({
  id: IDSchema,
  variantId: IDSchema,
  variantSku: NonEmptyStringSchema,
  productId: IDSchema,
  productName: NonEmptyStringSchema,
  category: NonEmptyStringSchema,
  stock: z.number().int().min(0),
  reserved: z.number().int().min(0),
  available: z.number().int().min(0),
  minStock: z.number().int().min(0),
  maxStock: z.number().int().min(0),
  status: InventoryStatusSchema,
  lastUpdated: z.string().datetime(),
});

/**
 * Inventory movement record schema
 */
export const InventoryMovementSchema = z.object({
  id: IDSchema,
  variantId: IDSchema,
  type: InventoryMovementTypeSchema,
  quantity: z.number().int().positive(),
  reason: InventoryMovementReasonSchema,
  note: z.string().optional(),
  createdAt: z.string().datetime(),
});

/**
 * Request schema for adjusting inventory
 */
export const AdjustInventoryRequestSchema = z.object({
  quantity: z.number().int().positive(),
  type: InventoryMovementTypeSchema,
  reason: InventoryMovementReasonSchema,
  note: z.string().optional(),
});

/**
 * Slow moving item report schema
 */
export const SlowMovingItemSchema = z.object({
  variantId: IDSchema,
  productName: NonEmptyStringSchema,
  category: NonEmptyStringSchema,
  stock: z.number().int().min(0),
  daysSinceLastSale: z.number().int().min(0),
  totalValue: z.number().min(0),
});

export type InventoryStatus = z.infer<typeof InventoryStatusSchema>;
export type InventoryMovementType = z.infer<typeof InventoryMovementTypeSchema>;
export type InventoryMovementReason = z.infer<typeof InventoryMovementReasonSchema>;
export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type InventoryMovement = z.infer<typeof InventoryMovementSchema>;
export type AdjustInventoryRequest = z.infer<typeof AdjustInventoryRequestSchema>;
export type SlowMovingItem = z.infer<typeof SlowMovingItemSchema>;