import { Context } from "hono";
import { IOrderUseCase } from "@/domain/usecases/IOrderUseCase";
import { StatusBuilder } from "@/utils";
import { CreateOrderInput, OrderStatus } from "@/utils/schemas/order";
import { CheckoutRequest } from "@/utils/schemas/endpoints/orders";

export class OrderController {
  constructor(private orderUseCase: IOrderUseCase) {}

  async checkout(c: Context) {
    try {
      const userId = c.get("userId") as string;
      if (!userId) {
        return c.json(StatusBuilder.fail("Unauthorized: User ID not found"), 401);
      }

      const body = (await c.req.json()) as CheckoutRequest;
      const response = await this.orderUseCase.checkout(userId, body);

      if (response.success) {
        return c.json(response, 201);
      } else {
        return c.json(response, 400);
      }
    } catch (error: unknown) {
      const err = error as Error;
      return c.json(
        StatusBuilder.fail(err.message || "Internal Server Error"),
        500
      );
    }
  }

  async createOrder(c: Context) {
    try {
      const userId = c.get("userId") as string;
      if (!userId) {
        return c.json(StatusBuilder.fail("Unauthorized: User ID not found"), 401);
      }

      const body = await c.req.json() as Omit<CreateOrderInput, "customerId">;
      
      const input: CreateOrderInput = {
        ...body,
        customerId: userId,
      };

      const response = await this.orderUseCase.createOrder(input);

      if (response.success) {
        return c.json(response, 201);
      } else {
        return c.json(response, 400);
      }
    } catch (error: unknown) {
      const err = error as Error;
      return c.json(
        StatusBuilder.fail(err.message || "Internal Server Error"),
        500
      );
    }
  }

  async getOrder(c: Context) {
    try {
      const userId = c.get("userId") as string;
      const role = c.get("role") as string;
      const id = c.req.param("id");

      if (!userId) {
        return c.json(StatusBuilder.fail("Unauthorized"), 401);
      }

      const response = await this.orderUseCase.getOrder(id, userId, role);

      if (response.success) {
        return c.json(response, 200);
      } else {
        const status = response.error?.includes("Forbidden") ? 403 : 404;
        return c.json(response, status);
      }
    } catch (error: unknown) {
      const err = error as Error;
      return c.json(
        StatusBuilder.fail(err.message || "Internal Server Error"),
        500
      );
    }
  }

  async listCustomerOrders(c: Context) {
    try {
      const userId = c.get("userId") as string;
      if (!userId) {
        return c.json(StatusBuilder.fail("Unauthorized"), 401);
      }

      const response = await this.orderUseCase.listCustomerOrders(userId);

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error: unknown) {
      const err = error as Error;
      return c.json(
        StatusBuilder.fail(err.message || "Internal Server Error"),
        500
      );
    }
  }

  async listSellerOrders(c: Context) {
    try {
      const userId = c.get("userId") as string;
      if (!userId) {
        return c.json(StatusBuilder.fail("Unauthorized"), 401);
      }

      const response = await this.orderUseCase.listSellerOrders(userId);

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error: unknown) {
      const err = error as Error;
      return c.json(
        StatusBuilder.fail(err.message || "Internal Server Error"),
        500
      );
    }
  }

  async updateOrderStatus(c: Context) {
    try {
      const userId = c.get("userId") as string;
      if (!userId) {
        return c.json(StatusBuilder.fail("Unauthorized"), 401);
      }

      const id = c.req.param("id");
      const body = await c.req.json() as { status: OrderStatus };
      const status = body.status;

      if (!status) {
        return c.json(StatusBuilder.fail("Status is required"), 400);
      }

      const response = await this.orderUseCase.updateOrderStatus(id, userId, status);

      if (response.success) {
        return c.json(response, 200);
      } else {
        const statusCode = response.error?.includes("Forbidden") ? 403 : 400;
        return c.json(response, statusCode);
      }
    } catch (error: unknown) {
      const err = error as Error;
      return c.json(
        StatusBuilder.fail(err.message || "Internal Server Error"),
        500
      );
    }
  }

  async cancelOrder(c: Context) {
    try {
      const userId = c.get("userId") as string;
      if (!userId) {
        return c.json(StatusBuilder.fail("Unauthorized"), 401);
      }

      const id = c.req.param("id");
      const response = await this.orderUseCase.cancelOrder(id, userId);

      if (response.success) {
        return c.json(response, 200);
      } else {
        const statusCode = response.error?.includes("Forbidden") ? 403 : 400;
        return c.json(response, statusCode);
      }
    } catch (error: unknown) {
      const err = error as Error;
      return c.json(
        StatusBuilder.fail(err.message || "Internal Server Error"),
        500
      );
    }
  }

  async getSalesReport(c: Context) {
    try {
      const userId = c.get("userId") as string;

      if (!userId) {
        return c.json(StatusBuilder.fail("Unauthorized"), 401);
      }

      const startDate = c.req.query("startDate");
      const endDate = c.req.query("endDate");

      const response = await this.orderUseCase.getSalesReport(userId, {
        startDate,
        endDate,
      });

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error: unknown) {
      const err = error as Error;
      return c.json(
        StatusBuilder.fail(err.message || "Internal Server Error"),
        500
      );
    }
  }
}