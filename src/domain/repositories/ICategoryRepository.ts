import { Category } from "@/utils/schemas/category";

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  save(category: Category): Promise<Category>;
  delete(id: string): Promise<boolean>;
}

