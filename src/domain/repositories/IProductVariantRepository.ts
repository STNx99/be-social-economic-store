import { ProductVariant } from "@/utils/schemas/productVariant";
import { InventoryItem } from "@/utils/schemas/inventory";

export interface IProductVariantRepository {
  findById(id: string): Promise<ProductVariant | null>;
  findByProductId(productId: string): Promise<ProductVariant[]>;
  findBySku(sku: string): Promise<ProductVariant | null>;
  save(variant: ProductVariant): Promise<ProductVariant>;
  delete(id: string): Promise<boolean>;
  createVariantWithInventory(
    variant: ProductVariant,
    inventory: InventoryItem,
  ): Promise<ProductVariant>;
  deleteVariantWithInventory(variantId: string): Promise<boolean>;
}