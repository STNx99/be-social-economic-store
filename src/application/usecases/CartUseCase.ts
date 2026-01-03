import { ICartRepository } from "@/domain/repositories/ICartRepository";
import { IProductRepository } from "@/domain/repositories/IProductRepository";
import { IProductVariantRepository } from "@/domain/repositories/IProductVariantRepository";
import { ICartUseCase } from "@/domain/usecases/ICartUseCase";
import { CartEntity } from "@/domain/entities/Cart";
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
import { CartRepository } from "@/adapters/repositories/CartRepository";

export class CartUseCase implements ICartUseCase {
  constructor(
    private cartRepository: ICartRepository,
    private productRepository: IProductRepository,
    private variantRepository: IProductVariantRepository,
  ) {}

  async addToCart(
    request: AddToCartRequest,
    userId: string,
  ): Promise<AddToCartResponse> {
    try {
      let validatedRequest;
      try {
        validatedRequest = validateData(AddToCartRequestSchema, request);
      } catch (error: unknown) {
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

      let stockAvailable = product.stock;
      let price = product.price;
      let name = product.name;

      if (validatedRequest.variantId) {
        const variant = await this.variantRepository.findById(validatedRequest.variantId);
        if (!variant || variant.productId !== product.id) {
          return StatusBuilder.fail("Product variant not found", [
            {
              field: "variantId",
              message: "Variant does not exist for this product",
            },
          ]);
        }
        stockAvailable = variant.stock;
        price = variant.price;
        name = `${product.name} - ${variant.name}`;
      }

      if (stockAvailable < validatedRequest.quantity) {
        return StatusBuilder.fail("Insufficient stock", [
          {
            field: "quantity",
            message: `Not enough stock. Available: ${stockAvailable}`,
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

      const cartItem = {
        productId: product.id,
        variantId: validatedRequest.variantId,
        quantity: validatedRequest.quantity,
        price: price,
        name: name,
      };

      const existingItemIndex = cart.items.findIndex(item => 
        item.productId === cartItem.productId && 
        item.variantId === cartItem.variantId
      );

      let updatedItems;
      if (existingItemIndex !== -1) {
        updatedItems = cart.items.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, quantity: item.quantity + cartItem.quantity }
            : item
        );
      } else {
        updatedItems = [...cart.items, cartItem];
      }

      const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const updatedCart = { ...cart, items: updatedItems, total, updatedAt: new Date() };

      const cartRepo = this.cartRepository as CartRepository;
      if ('addToCartWithInventoryUpdate' in cartRepo) {
        await cartRepo.addToCartWithInventoryUpdate(
          updatedCart,
          validatedRequest.productId,
          validatedRequest.quantity,
          validatedRequest.variantId,
        );
      } else {
        await this.cartRepository.save(updatedCart);
        await this.cartRepository.updateProductStock(
          validatedRequest.productId,
          validatedRequest.quantity,
          validatedRequest.variantId,
        );
      }

      const savedCart = await this.cartRepository.findByUserId(userId);
      console.log(savedCart)
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
      } catch (error: unknown) {
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
      } catch (error: unknown) {
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

      const cartItem = cart.items.find((item) => 
        item.productId === validatedRequest.productId && 
        item.variantId === validatedRequest.variantId
      );
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

      if (product.status !== "active") {
        return StatusBuilder.fail("Product is not available", [
          {
            field: "productId",
            message: "Product is inactive or unavailable",
          },
        ]);
      }

      let stockAvailable = product.stock;
      if (validatedRequest.variantId) {
        const variant = await this.variantRepository.findById(validatedRequest.variantId);
        if (!variant) {
          return StatusBuilder.fail("Variant not found");
        }
        stockAvailable = variant.stock;
      }

      const quantityDifference = validatedRequest.quantity - cartItem.quantity;
      if (quantityDifference > 0 && stockAvailable < quantityDifference) {
        return StatusBuilder.fail("Insufficient stock", [
          {
            field: "quantity",
            message: `Not enough stock. Available: ${stockAvailable}`,
          },
        ]);
      }

      if (validatedRequest.quantity <= 0) {
        return StatusBuilder.fail("Invalid quantity", [
          {
            field: "quantity",
            message: "Quantity must be greater than 0",
          },
        ]);
      }

      const updatedItems = cart.items.map(item => 
        (item.productId === validatedRequest.productId && item.variantId === validatedRequest.variantId)
          ? { ...item, quantity: validatedRequest.quantity }
          : item
      );
      const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const updatedCart = { ...cart, items: updatedItems, total, updatedAt: new Date() };

      if (quantityDifference !== 0) {
        await this.cartRepository.updateProductStock(
          validatedRequest.productId,
          quantityDifference,
          validatedRequest.variantId,
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
      } catch (error: unknown) {
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

      const cartItem = cart.items.find((item) => 
        item.productId === validatedRequest.productId && 
        item.variantId === validatedRequest.variantId
      );
      if (!cartItem) {
        return StatusBuilder.fail("Item not found in cart", [
          {
            field: "productId",
            message: "Product is not in the cart",
          },
        ]);
      }

      const items = cart.items.filter(item => 
        !(item.productId === validatedRequest.productId && item.variantId === validatedRequest.variantId)
      );
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const updatedCart = { ...cart, items, total, updatedAt: new Date() };

      await this.cartRepository.updateProductStock(
        validatedRequest.productId,
        -cartItem.quantity,
        validatedRequest.variantId,
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
      } catch (error: unknown) {
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
          item.variantId,
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

