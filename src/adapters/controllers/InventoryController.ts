import { Context } from "hono";
import { IInventoryUseCase } from "@/domain/usecases/IInventoryUseCase";
import { StatusBuilder } from "@/utils";
import { AdjustInventoryRequest } from "@/utils/schemas/inventory";

export class InventoryController {
  constructor(private inventoryUseCase: IInventoryUseCase) {}

  async getInventoryByVariantId(c: Context) {
    try {
      const variantId = c.req.param("variantId");
      const response = await this.inventoryUseCase.getInventoryByVariantId(variantId);
      
      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 404);
      }
    } catch (error) {
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "Internal Server Error"),
        500,
      );
    }
  }

  async getInventoryByProductId(c: Context) {
    try {
      const productId = c.req.param("productId");
      const response = await this.inventoryUseCase.getInventoryByProductId(productId);
      
      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error) {
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "Internal Server Error"),
        500,
      );
    }
  }

  async listInventory(c: Context) {
    try {
      const response = await this.inventoryUseCase.listInventory();
      
      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error) {
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "Internal Server Error"),
        500,
      );
    }
  }

  async adjustInventory(c: Context) {
    try {
      const variantId = c.req.param("variantId");
      const body = (await c.req.json()) as AdjustInventoryRequest;
      const response = await this.inventoryUseCase.adjustInventory(variantId, body);
      
      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error) {
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "Internal Server Error"),
        500,
      );
    }
  }

  async getMovementHistory(c: Context) {
    try {
      const variantId = c.req.param("variantId");
      const response = await this.inventoryUseCase.getMovementHistory(variantId);
      
      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error) {
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "Internal Server Error"),
        500,
      );
    }
  }

  async getSlowMovingItems(c: Context) {
    try {
      const daysThresholdStr = c.req.query("daysThreshold");
      const daysThreshold = daysThresholdStr ? parseInt(daysThresholdStr) : 30;
      
      const response = await this.inventoryUseCase.getSlowMovingItems(daysThreshold);
      
      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error) {
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "Internal Server Error"),
        500,
      );
    }
  }
}