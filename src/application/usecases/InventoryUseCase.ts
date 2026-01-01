import { IInventoryUseCase, InventoryResponse } from "@/domain/usecases/IInventoryUseCase";
import { IInventoryRepository } from "@/domain/repositories/IInventoryRepository";
import { StatusBuilder } from "@/utils";

export class InventoryUseCase implements IInventoryUseCase {
  constructor(private inventoryRepository: IInventoryRepository) {}

  async getInventory(id: string): Promise<InventoryResponse> {
    // TODO: Implement logic
    return StatusBuilder.fail("Not implemented");
  }

  async listInventories(): Promise<InventoryResponse> {
    // TODO: Implement logic
    return StatusBuilder.fail("Not implemented");
  }

  async createInventory(request: any): Promise<InventoryResponse> {
    // TODO: Implement logic
    return StatusBuilder.fail("Not implemented");
  }

  async updateInventory(id: string, request: any): Promise<InventoryResponse> {
    // TODO: Implement logic
    return StatusBuilder.fail("Not implemented");
  }

  async deleteInventory(id: string): Promise<InventoryResponse> {
    // TODO: Implement logic
    return StatusBuilder.fail("Not implemented");
  }
}

