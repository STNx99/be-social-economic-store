import { Context } from "hono";
import { IInventoryUseCase } from "@/domain/usecases/IInventoryUseCase";
import { StatusBuilder } from "@/utils";

export class InventoryController {
  constructor(private inventoryUseCase: IInventoryUseCase) {}

  async getInventory(c: Context) {
    try {
      const id = c.req.param("id");
      const response = await this.inventoryUseCase.getInventory(id);
      
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

  async listInventories(c: Context) {
    try {
      const response = await this.inventoryUseCase.listInventories();
      
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

  async createInventory(c: Context) {
    try {
      const body = await c.req.json();
      const response = await this.inventoryUseCase.createInventory(body);
      
      if (response.success) {
        return c.json(response, 201);
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

  async updateInventory(c: Context) {
    try {
      const id = c.req.param("id");
      const body = await c.req.json();
      const response = await this.inventoryUseCase.updateInventory(id, body);
      
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

  async deleteInventory(c: Context) {
    try {
      const id = c.req.param("id");
      const response = await this.inventoryUseCase.deleteInventory(id);
      
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

