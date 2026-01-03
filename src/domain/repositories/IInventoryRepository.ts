import { InventoryItem, InventoryMovement, SlowMovingItem } from "@/utils/schemas/inventory";
import { Product } from "@/utils/schemas/product";
import { ProductVariant } from "@/utils/schemas/productVariant";

export interface IInventoryRepository {
  findByVariantId(variantId: string): Promise<InventoryItem | null>;
  findByProductId(productId: string): Promise<InventoryItem[]>;
  findAll(): Promise<InventoryItem[]>;
  save(inventory: InventoryItem): Promise<InventoryItem>;
  deleteByVariantId(variantId: string): Promise<boolean>;
  saveMovement(movement: InventoryMovement): Promise<InventoryMovement>;
  findMovementsByVariantId(variantId: string): Promise<InventoryMovement[]>;
  getSlowMovingItems(daysThreshold: number): Promise<SlowMovingItem[]>;
  adjustInventoryWithTransaction(
    inventoryItem: InventoryItem,
    movement: InventoryMovement,
    variant: ProductVariant,
    product: Product,
  ): Promise<void>;
}