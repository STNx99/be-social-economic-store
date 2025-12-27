import { Product } from "@/utils/schemas/product";

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  findByCategory(category: string): Promise<Product[]>;
  findByStatus(status: 'active' | 'inactive' | 'out_of_stock'): Promise<Product[]>;
  searchByName(searchTerm: string): Promise<Product[]>;
  save(product: Product): Promise<Product>;
  delete(id: string): Promise<boolean>;
  findByIds(ids: string[]): Promise<Product[]>;
}






