import { Context } from "hono";
import { IShipmentUseCase } from "@/domain/usecases/IShipmentUseCase";
import { StatusBuilder } from "@/utils";
import { CreateShipmentInput, UpdateShipmentInput, ShipmentStatus } from "@/utils/schemas/shipment";

export class ShipmentController {
  constructor(private shipmentUseCase: IShipmentUseCase) {}

  async createShipment(c: Context) {
    try {
      const body = await c.req.json() as CreateShipmentInput;
      const response = await this.shipmentUseCase.createShipment(body);

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

  async getShipment(c: Context) {
    try {
      const id = c.req.param("id");
      const response = await this.shipmentUseCase.getShipment(id);

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

  async getShipmentsByOrder(c: Context) {
    try {
      const orderId = c.req.param("orderId");
      const response = await this.shipmentUseCase.getShipmentsByOrder(orderId);

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

  async updateShipment(c: Context) {
    try {
      const id = c.req.param("id");
      const body = await c.req.json() as UpdateShipmentInput;
      const response = await this.shipmentUseCase.updateShipment(id, body);

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

  async updateShipmentStatus(c: Context) {
    try {
      const id = c.req.param("id");
      const body = await c.req.json() as { status: ShipmentStatus };
      const status = body.status;

      if (!status) {
        return c.json(StatusBuilder.fail("Status is required"), 400);
      }

      const response = await this.shipmentUseCase.updateShipmentStatus(id, status);

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

  async listAllShipments(c: Context) {
    try {
      const response = await this.shipmentUseCase.listAllShipments();

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