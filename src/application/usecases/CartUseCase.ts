import {
  CartEntity,
} from "@/domain/entities/Cart";
import { ICartRepository } from "@/domain/repositories/ICartRepository";
import { IProductRepository } from "@/domain/repositories/IProductRepository";
import { validateData, ValidationError, StatusBuilder } from "@/utils";
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
import {
  AddToCartRequestSchema,
  GetCartRequestSchema,
  UpdateCartItemRequestSchema,
  RemoveFromCartRequestSchema,
  ClearCartRequestSchema,
} from "@/utils/schemas/endpoints/cart";
import { ICartUseCase } from "@/domain/usecases/ICartUseCase";
import { CartRepository } from "@/adapters/repositories/CartRepository";

export class CartUseCase implements ICartUseCase {
  constructor(
    private cartRepository: ICartRepository,
    private productRepository: IProductRepository,
  ) {}

  async addToCart(
    request: AddToCartRequest,
    userId: string,
  ): Promise<AddToCartResponse> {
    try {
      let validatedRequest;
      try {
        validatedRequest = validateData(AddToCartRequestSchema, request);
      } catch (error) {
        if (error instanceof ValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }

      const product = await this.productRepository.findById(validatedRequest.productId);
      if (!product) {
        return StatusBuilder.fail("Product not found", [
          {
            field: "productId",
            message: "Product does not exist",
          },
        ]);
      }

      if (product.stock < validatedRequest.quantity) {
        return StatusBuilder.fail("Insufficient stock", [
          {
            field: "quantity",
            message: `Not enough stock. Available: ${product.stock}`,
          },
        ]);
      }

      if (product.status !== "active") {
        return StatusBuilder.fail("Product is not available", [
          {
            field: "productId",
            message: "Product is inactive or unavailable",
          },
        ]);
      }

      let cart = await this.cartRepository.findByUserId(userId);
      
      if (!cart) {
        const newCart = new CartEntity(
          crypto.randomUUID(),
          userId,
          [],
          0,
        );
        cart = newCart.toJSON();
      }

      const cartEntity = CartEntity.fromValidatedData(cart);

      const cartItem = {
        productId: product.id,
        quantity: validatedRequest.quantity,
        price: product.price,
        name: product.name,
      };

      cartEntity.addItem(cartItem);
      const updatedCart = cartEntity.toJSON();

      const cartRepo = this.cartRepository as CartRepository;
      if ('addToCartWithInventoryUpdate' in cartRepo) {
        await cartRepo.addToCartWithInventoryUpdate(
          updatedCart,
          validatedRequest.productId,
          validatedRequest.quantity,
        );
      } else {
        await this.cartRepository.save(updatedCart);
        await this.cartRepository.updateProductStock(
          validatedRequest.productId,
          validatedRequest.quantity,
        );
      }

      const savedCart = await this.cartRepository.findByUserId(userId);
      return StatusBuilder.ok(savedCart!);
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      
      if (err?.name === "TransactionCanceledException" || err?.message?.includes("ConditionalCheckFailedException")) {
        return StatusBuilder.fail("Insufficient stock or product not found", [
          {
            field: "quantity",
            message: "Cannot add to cart. Please re-check available stock.",
          },
        ]);
      }

      if (err?.message?.includes("does not exist")) {
        return StatusBuilder.fail(
          "DynamoDB table does not exist. Please create the Cart and Product tables first.",
        );
      }

      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async getCart(request: GetCartRequest): Promise<GetCartResponse> {
    try {
      let validatedRequest;
      try {
        validatedRequest = validateData(GetCartRequestSchema, request);
      } catch (error) {
        if (error instanceof ValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }

      const cart = await this.cartRepository.findByUserId(validatedRequest.userId);

      if (!cart) {
        const emptyCart = new CartEntity(
          crypto.randomUUID(),
          validatedRequest.userId,
          [],
          0,
        );
        return StatusBuilder.ok(emptyCart.toJSON());
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
      let validatedRequest;
      try {
        validatedRequest = validateData(UpdateCartItemRequestSchema, request);
      } catch (error) {
        if (error instanceof ValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }

      const cart = await this.cartRepository.findByUserId(userId);
      if (!cart) {
        return StatusBuilder.fail("Cart not found", [
          {
            field: "userId",
            message: "Cart does not exist",
          },
        ]);
      }

      const cartItem = cart.items.find((item) => item.productId === validatedRequest.productId);
      if (!cartItem) {
        return StatusBuilder.fail("Item not found in cart", [
          {
            field: "productId",
            message: "Product is not in the cart",
          },
        ]);
      }

      const product = await this.productRepository.findById(validatedRequest.productId);
      if (!product) {
        return StatusBuilder.fail("Product not found", [
          {
            field: "productId",
            message: "Product does not exist",
          },
        ]);
      }

      const quantityDifference = validatedRequest.quantity - cartItem.quantity;
      if (quantityDifference > 0 && product.stock < quantityDifference) {
        return StatusBuilder.fail("Insufficient stock", [
          {
            field: "quantity",
            message: `Not enough stock. Available: ${product.stock}`,
          },
        ]);
      }

      const cartEntity = CartEntity.fromValidatedData(cart);
      cartEntity.updateItemQuantity(validatedRequest.productId, validatedRequest.quantity);
      const updatedCart = cartEntity.toJSON();

      if (quantityDifference !== 0) {
        await this.cartRepository.updateProductStock(
          validatedRequest.productId,
          -quantityDifference, 
        );
      }

      await this.cartRepository.save(updatedCart);
      const savedCart = await this.cartRepository.findByUserId(userId);
      return StatusBuilder.ok(savedCart!);
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
      let validatedRequest;
      try {
        validatedRequest = validateData(RemoveFromCartRequestSchema, request);
      } catch (error) {
        if (error instanceof ValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }

      const cart = await this.cartRepository.findByUserId(userId);
      if (!cart) {
        return StatusBuilder.fail("Cart not found", [
          {
            field: "userId",
            message: "Cart does not exist",
          },
        ]);
      }

      const cartItem = cart.items.find((item) => item.productId === validatedRequest.productId);
      if (!cartItem) {
        return StatusBuilder.fail("Item not found in cart", [
          {
            field: "productId",
            message: "Product is not in the cart",
          },
        ]);
      }

      const cartEntity = CartEntity.fromValidatedData(cart);
      cartEntity.removeItem(validatedRequest.productId);
      const updatedCart = cartEntity.toJSON();

      await this.cartRepository.updateProductStock(
        validatedRequest.productId,
        -cartItem.quantity,
      );

      await this.cartRepository.save(updatedCart);
      const savedCart = await this.cartRepository.findByUserId(userId);
      return StatusBuilder.ok(savedCart!);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async clearCart(request: ClearCartRequest): Promise<ClearCartResponse> {
    try {
      let validatedRequest;
      try {
        validatedRequest = validateData(ClearCartRequestSchema, request);
      } catch (error) {
        if (error instanceof ValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }

      const cart = await this.cartRepository.findByUserId(validatedRequest.userId);
      if (!cart) {
        return StatusBuilder.fail("Cart not found", [
          {
            field: "userId",
            message: "Cart does not exist",
          },
        ]);
      }

      for (const item of cart.items) {
        await this.cartRepository.updateProductStock(
          item.productId,
          -item.quantity,
        );
      }

      const cartEntity = CartEntity.fromValidatedData(cart);
      cartEntity.clear();
      await this.cartRepository.save(cartEntity.toJSON());

      return StatusBuilder.ok(undefined);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}

