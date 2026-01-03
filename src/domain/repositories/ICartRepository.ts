import { Cart } from "@/utils/schemas/cart";

export interface ICartRepository {
  findByUserId(userId: string): Promise<Cart | null>;
  findById(id: string): Promise<Cart | null>;
  save(cart: Cart): Promise<Cart>;
  delete(id: string): Promise<boolean>;
  updateProductStock(productId: string, quantityToDeduct: number, variantId?: string): Promise<void>;
  addToCartWithInventoryUpdate(
    cart: Cart,
    productId: string,
    quantity: number,
    variantId?: string,
  ): Promise<Cart>;
}
