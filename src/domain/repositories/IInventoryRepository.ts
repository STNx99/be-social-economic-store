export interface Inventory {
  id: string;
  productId: string;
  availableQuantity: number;
  reservedQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventoryRepository {
  findById(id: string): Promise<Inventory | null>;
  findByProductId(productId: string): Promise<Inventory | null>;
  findAll(): Promise<Inventory[]>;
  save(inventory: Inventory): Promise<Inventory>;
  update(id: string, inventory: Partial<Inventory>): Promise<Inventory>;
  delete(id: string): Promise<boolean>;
}

