export interface InventoryResponse {
  success: boolean;
  data?: any;
  error?: string;
  details?: any;
}

export interface IInventoryUseCase {
  getInventory(id: string): Promise<InventoryResponse>;
  listInventories(): Promise<InventoryResponse>;
  createInventory(request: any): Promise<InventoryResponse>;
  updateInventory(id: string, request: any): Promise<InventoryResponse>;
  deleteInventory(id: string): Promise<InventoryResponse>;
}

