import { ProductVariant } from "@/utils/schemas/productVariant";

export interface IProductVariantRepository {
  findById(id: string): Promise<ProductVariant | null>;
  findByProductId(productId: string): Promise<ProductVariant[]>;
  findBySku(sku: string): Promise<ProductVariant | null>;
  save(variant: ProductVariant): Promise<ProductVariant>;
  delete(id: string): Promise<boolean>;
}