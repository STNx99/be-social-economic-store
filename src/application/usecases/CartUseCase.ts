import { ICartRepository } from "@/domain/repositories/ICartRepository";
import { IProductRepository } from "@/domain/repositories/IProductRepository";
import { ICartUseCase } from "@/domain/usecases/ICartUseCase";
import { StatusBuilder } from "@/utils";
import {
  AddToCartRequest,
  AddToCartResponse,
  GetCartRequest,
  GetCartResponse,
  UpdateCartItemRequest,
  UpdateCartItemResponse,
  RemoveFromCartRequest,
  RemoveFromCartResponse,
  ClearCartRequest,
  ClearCartResponse,
} from "@/utils/schemas/endpoints/cart";
import { Cart } from "@/utils/schemas/cart";

export class CartUseCase implements ICartUseCase {
  constructor(
    private cartRepository: ICartRepository,
    private productRepository: IProductRepository,
  ) {}

  async addToCart(request: AddToCartRequest, userId: string): Promise<AddToCartResponse> {
    try {
      const product = await this.productRepository.findById(request.productId);
      if (!product) {
        return StatusBuilder.fail("Product not found");
      }

      if (product.stock < request.quantity) {
        return StatusBuilder.fail("Insufficient stock");
      }

      let cart = await this.cartRepository.findByUserId(userId);
      if (!cart) {
        cart = {
          id: crypto.randomUUID(),
          userId,
          items: [],
          total: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      const existingItemIndex = cart.items.findIndex(
        (item) => item.productId === request.productId,
      );

      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += request.quantity;
      } else {
        cart.items.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: request.quantity,
          image: product.images[0],
        });
      }

      cart.total = cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      cart.updatedAt = new Date();

      const savedCart = await this.cartRepository.addToCartWithInventoryUpdate(
        cart,
        product.id,
        request.quantity,
      );

      return StatusBuilder.ok(savedCart);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async getCart(request: GetCartRequest): Promise<GetCartResponse> {
    try {
      let cart = await this.cartRepository.findByUserId(request.userId);
      if (!cart) {
        cart = {
          id: crypto.randomUUID(),
          userId: request.userId,
          items: [],
          total: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await this.cartRepository.save(cart);
      }
      return StatusBuilder.ok(cart);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async updateCartItem(
    request: UpdateCartItemRequest,
    userId: string,
  ): Promise<UpdateCartItemResponse> {
    try {
      const cart = await this.cartRepository.findByUserId(userId);
      if (!cart) {
        return StatusBuilder.fail("Cart not found");
      }

      const itemIndex = cart.items.findIndex(
        (item) => item.productId === request.productId,
      );

      if (itemIndex === -1) {
        return StatusBuilder.fail("Item not found in cart");
      }

      const product = await this.productRepository.findById(request.productId);
      if (!product) {
        return StatusBuilder.fail("Product not found");
      }

      const quantityDiff = request.quantity - cart.items[itemIndex].quantity;
      if (quantityDiff > 0 && product.stock < quantityDiff) {
        return StatusBuilder.fail("Insufficient stock");
      }

      cart.items[itemIndex].quantity = request.quantity;
      cart.total = cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      cart.updatedAt = new Date();

      // Note: This should ideally be a transaction too if we want to update stock
      const savedCart = await this.cartRepository.save(cart);
      if (quantityDiff !== 0) {
        await this.cartRepository.updateProductStock(product.id, quantityDiff);
      }

      return StatusBuilder.ok(savedCart);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async removeFromCart(
    request: RemoveFromCartRequest,
    userId: string,
  ): Promise<RemoveFromCartResponse> {
    try {
      const cart = await this.cartRepository.findByUserId(userId);
      if (!cart) {
        return StatusBuilder.fail("Cart not found");
      }

      const itemIndex = cart.items.findIndex(
        (item) => item.productId === request.productId,
      );

      if (itemIndex === -1) {
        return StatusBuilder.fail("Item not found in cart");
      }

      const removedItem = cart.items[itemIndex];
      cart.items.splice(itemIndex, 1);
      cart.total = cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      cart.updatedAt = new Date();

      const savedCart = await this.cartRepository.save(cart);
      // Return stock to inventory
      await this.cartRepository.updateProductStock(removedItem.productId, -removedItem.quantity);

      return StatusBuilder.ok(savedCart);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async clearCart(request: ClearCartRequest): Promise<ClearCartResponse> {
    try {
      const cart = await this.cartRepository.findByUserId(request.userId);
      if (!cart) {
        return StatusBuilder.ok(undefined);
      }

      // Return all items to stock
      for (const item of cart.items) {
        await this.cartRepository.updateProductStock(item.productId, -item.quantity);
      }

      cart.items = [];
      cart.total = 0;
      cart.updatedAt = new Date();
      await this.cartRepository.save(cart);

      return StatusBuilder.ok(undefined);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
