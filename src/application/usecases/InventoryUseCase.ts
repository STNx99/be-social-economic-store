import { IInventoryUseCase, InventoryResponse } from "@/domain/usecases/IInventoryUseCase";
import { IInventoryRepository } from "@/domain/repositories/IInventoryRepository";
import { IProductRepository } from "@/domain/repositories/IProductRepository";
import { IProductVariantRepository } from "@/domain/repositories/IProductVariantRepository";
import { 
  InventoryItem, 
  InventoryMovement, 
  AdjustInventoryRequest, 
  SlowMovingItem,
  InventoryStatus
} from "@/utils/schemas/inventory";
import { StatusBuilder } from "@/utils";

export class InventoryUseCase implements IInventoryUseCase {
  constructor(
    private inventoryRepository: IInventoryRepository,
    private productRepository: IProductRepository,
    private variantRepository: IProductVariantRepository,
  ) {}

  async getInventoryByVariantId(variantId: string): Promise<InventoryResponse<InventoryItem>> {
    try {
      const item = await this.inventoryRepository.findByVariantId(variantId);
      if (!item) {
        return StatusBuilder.fail("Inventory item not found") as InventoryResponse<InventoryItem>;
      }
      return { success: true, data: item };
    } catch (error) {
      return StatusBuilder.fail(error instanceof Error ? error.message : "Internal Server Error") as InventoryResponse<InventoryItem>;
    }
  }

  async getInventoryByProductId(productId: string): Promise<InventoryResponse<InventoryItem[]>> {
    try {
      const items = await this.inventoryRepository.findByProductId(productId);
      return { success: true, data: items };
    } catch (error) {
      return StatusBuilder.fail(error instanceof Error ? error.message : "Internal Server Error") as InventoryResponse<InventoryItem[]>;
    }
  }

  async listInventory(): Promise<InventoryResponse<InventoryItem[]>> {
    try {
      const items = await this.inventoryRepository.findAll();
      return { success: true, data: items };
    } catch (error) {
      return StatusBuilder.fail(error instanceof Error ? error.message : "Internal Server Error") as InventoryResponse<InventoryItem[]>;
    }
  }

  async adjustInventory(variantId: string, request: AdjustInventoryRequest): Promise<InventoryResponse<InventoryItem>> {
    try {
      const item = await this.inventoryRepository.findByVariantId(variantId);
      if (!item) {
        return StatusBuilder.fail("Inventory item not found") as InventoryResponse<InventoryItem>;
      }

      let newStock = item.stock;
      if (request.type === 'in') {
        newStock += request.quantity;
      } else {
        if (item.available < request.quantity) {
          return StatusBuilder.fail("Insufficient available stock") as InventoryResponse<InventoryItem>;
        }
        newStock -= request.quantity;
      }

      const newAvailable = newStock - item.reserved;
      const newStatus = this.calculateStatus(newStock, item.minStock);

      const updatedItem: InventoryItem = {
        ...item,
        stock: newStock,
        available: newAvailable,
        status: newStatus,
        lastUpdated: new Date().toISOString(),
      };

      const movement: InventoryMovement = {
        id: crypto.randomUUID(),
        variantId,
        type: request.type,
        quantity: request.quantity,
        reason: request.reason,
        note: request.note,
        createdAt: new Date().toISOString(),
      };

      // Sync with Product Variant
      const variant = await this.variantRepository.findById(variantId);
      if (!variant) {
        return StatusBuilder.fail("Product variant not found") as InventoryResponse<InventoryItem>;
      }

      const updatedVariant = {
        ...variant,
        stock: newStock,
        updatedAt: new Date(),
      };

      // Sync with Product total stock
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        return StatusBuilder.fail("Product not found") as InventoryResponse<InventoryItem>;
      }

      const allVariants = await this.variantRepository.findByProductId(item.productId);
      const totalStock = allVariants.length > 0 
        ? allVariants.reduce((sum, v) => sum + (v.id === variantId ? newStock : v.stock), 0)
        : newStock;
      
      const updatedProduct = {
        ...product,
        stock: totalStock,
        updatedAt: new Date(),
      };

      await this.inventoryRepository.adjustInventoryWithTransaction(
        updatedItem,
        movement,
        updatedVariant,
        updatedProduct
      );

      return { success: true, data: updatedItem };
    } catch (error) {
      return StatusBuilder.fail(error instanceof Error ? error.message : "Internal Server Error") as InventoryResponse<InventoryItem>;
    }
  }

  async getMovementHistory(variantId: string): Promise<InventoryResponse<InventoryMovement[]>> {
    try {
      const movements = await this.inventoryRepository.findMovementsByVariantId(variantId);
      return { success: true, data: movements };
    } catch (error) {
      return StatusBuilder.fail(error instanceof Error ? error.message : "Internal Server Error") as InventoryResponse<InventoryMovement[]>;
    }
  }

  async getSlowMovingItems(daysThreshold: number = 30): Promise<InventoryResponse<SlowMovingItem[]>> {
    try {
      const items = await this.inventoryRepository.getSlowMovingItems(daysThreshold);
      return { success: true, data: items };
    } catch (error) {
      return StatusBuilder.fail(error instanceof Error ? error.message : "Internal Server Error") as InventoryResponse<SlowMovingItem[]>;
    }
  }

  private calculateStatus(stock: number, minStock: number): InventoryStatus {
    if (stock <= 0) return 'out_of_stock';
    if (stock <= minStock) return 'low_stock';
    return 'in_stock';
  }
}