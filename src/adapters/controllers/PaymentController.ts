import { Context } from "hono";
import { IPaymentUseCase } from "@/domain/usecases/IPaymentUseCase";
import { StatusBuilder } from "@/utils";
import { CreatePaymentInput, UpdatePaymentInput } from "@/utils/schemas/payment";

export class PaymentController {
  constructor(private paymentUseCase: IPaymentUseCase) {}

  async createPayment(c: Context) {
    try {
      const body = await c.req.json() as CreatePaymentInput;
      const response = await this.paymentUseCase.createPayment(body);

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

  async getPayment(c: Context) {
    try {
      const id = c.req.param("id");
      const response = await this.paymentUseCase.getPayment(id);

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 404);
      }
    } catch (error: unknown) {
      const err = error as Error;
      return c.json(
        StatusBuilder.fail(err.message || "Internal Server Error"),
        500
      );
    }
  }

  async getPaymentsByOrder(c: Context) {
    try {
      const orderId = c.req.param("orderId");
      const response = await this.paymentUseCase.getPaymentsByOrder(orderId);

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

  async updatePayment(c: Context) {
    try {
      const id = c.req.param("id");
      const body = await c.req.json() as UpdatePaymentInput;
      const response = await this.paymentUseCase.updatePayment(id, body);

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

  async processPayment(c: Context) {
    try {
      const id = c.req.param("id");
      const response = await this.paymentUseCase.processPayment(id);

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

  async listAllPayments(c: Context) {
    try {
      const response = await this.paymentUseCase.listAllPayments();

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