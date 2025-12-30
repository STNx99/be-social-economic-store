import { Product } from "@/utils/schemas/product";
import { ProductStatus } from "@/utils/schemas/endpoints/products";

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  findByCategory(category: string): Promise<Product[]>;
  findByStatus(status: ProductStatus): Promise<Product[]>;
  searchByName(searchTerm: string): Promise<Product[]>;
  save(product: Product): Promise<Product>;
  delete(id: string): Promise<boolean>;
  findByIds(ids: string[]): Promise<Product[]>;
}






