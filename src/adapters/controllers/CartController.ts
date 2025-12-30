import { Context } from "hono";
import {
  AddToCartRequest,
  UpdateCartItemRequest,
  RemoveFromCartRequest,
  ClearCartRequest,
} from "@/utils/schemas/endpoints/cart";
import { ICartUseCase } from "@/domain/usecases/ICartUseCase";
import { StatusBuilder } from "@/utils";

export class CartController {
  constructor(private cartUseCase: ICartUseCase) {}

  async addToCart(c: Context) {
    try {
      const body = await c.req.json();
      const userId = c.get("userId") || c.req.header("x-user-id");
      
      if (!userId) {
        return c.json(
          StatusBuilder.fail("User ID is required"),
          401,
        );
      }

      const response = await this.cartUseCase.addToCart(
        body as AddToCartRequest,
        userId,
      );

      if (response.success) {
        return c.json(response, 201);
      } else {
        return c.json(response, 400);
      }
    } catch (error) {
      console.error(error);
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "error"),
        500,
      );
    }
  }

  async getCart(c: Context) {
    try {
      const userId = c.get("userId") || c.req.header("x-user-id") || c.req.query("userId");
      
      if (!userId) {
        return c.json(
          StatusBuilder.fail("User ID is required"),
          401,
        );
      }

      const response = await this.cartUseCase.getCart({ userId });

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 404);
      }
    } catch (error) {
      console.error(error);
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "error"),
        500,
      );
    }
  }

  async updateCartItem(c: Context) {
    try {
      const body = await c.req.json();
      const userId = c.get("userId") || c.req.header("x-user-id");
      
      if (!userId) {
        return c.json(
          StatusBuilder.fail("User ID is required"),
          401,
        );
      }

      const response = await this.cartUseCase.updateCartItem(
        body as UpdateCartItemRequest,
        userId,
      );

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error) {
      console.error(error);
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "error"),
        500,
      );
    }
  }

  async removeFromCart(c: Context) {
    try {
      const body = await c.req.json();
      const userId = c.get("userId") || c.req.header("x-user-id");
      
      if (!userId) {
        return c.json(
          StatusBuilder.fail("User ID is required"),
          401,
        );
      }

      const response = await this.cartUseCase.removeFromCart(
        body as RemoveFromCartRequest,
        userId,
      );

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error) {
      console.error(error);
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "error"),
        500,
      );
    }
  }

  async clearCart(c: Context) {
    try {
      const userId = c.get("userId") || c.req.header("x-user-id");
      
      if (!userId) {
        return c.json(
          StatusBuilder.fail("User ID is required"),
          401,
        );
      }

      const response = await this.cartUseCase.clearCart({ userId });

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error) {
      console.error(error);
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "error"),
        500,
      );
    }
  }
}

