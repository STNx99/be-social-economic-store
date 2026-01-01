import { 
  InventoryItem, 
  InventoryMovement, 
  AdjustInventoryRequest, 
  SlowMovingItem 
} from "@/utils/schemas/inventory";

export interface InventoryResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export interface IInventoryUseCase {
  /**
   * Get inventory details for a specific variant
   */
  getInventoryByVariantId(variantId: string): Promise<InventoryResponse<InventoryItem>>;

  /**
   * Get all inventory items for a specific product
   */
  getInventoryByProductId(productId: string): Promise<InventoryResponse<InventoryItem[]>>;

  /**
   * List all inventory items
   */
  listInventory(): Promise<InventoryResponse<InventoryItem[]>>;

  /**
   * Adjust stock levels and record movement
   */
  adjustInventory(variantId: string, request: AdjustInventoryRequest): Promise<InventoryResponse<InventoryItem>>;

  /**
   * Get movement history for a specific variant
   */
  getMovementHistory(variantId: string): Promise<InventoryResponse<InventoryMovement[]>>;

  /**
   * Get a report of slow moving items
   */
  getSlowMovingItems(daysThreshold?: number): Promise<InventoryResponse<SlowMovingItem[]>>;
}