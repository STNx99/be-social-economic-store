import { z } from "zod";
import {
  ProductSchema,
  CreateProductSchema,
  CreateProductInput,
  UpdateProductSchema,
  UpdateProductInput,
  Product,
} from "@/utils/schemas/product";

export class ProductEntity implements Product {
  public readonly id: string;
  public readonly name: string;
  public readonly description?: string;
  public readonly price: number;
  public readonly stock: number;
  public readonly images: string[];
  public readonly category?: string;
  public readonly status: 'active' | 'inactive' | 'out_of_stock';
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(
    id: string,
    name: string,
    price: number,
    stock: number,
    images: string[] = [],
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    description?: string,
    category?: string,
    status: 'active' | 'inactive' | 'out_of_stock' = 'active',
  ) {
    const productData = {
      id,
      name,
      description,
      price,
      stock,
      images,
      category,
      status,
      createdAt,
      updatedAt,
    };
    const result = ProductSchema.safeParse(productData);

    if (!result.success) {
      const errors = result.error.issues.map((err: z.core.$ZodIssue) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      throw new DomainValidationError("Invalid Product data", errors);
    }

    this.id = result.data.id;
    this.name = result.data.name;
    this.description = result.data.description;
    this.price = result.data.price;
    this.stock = result.data.stock;
    this.images = result.data.images;
    this.category = result.data.category;
    this.status = result.data.status;
    this.createdAt = result.data.createdAt;
    this.updatedAt = result.data.updatedAt;
  }

  static fromValidatedData(data: Product): ProductEntity {
    return new ProductEntity(
      data.id,
      data.name,
      data.price,
      data.stock,
      data.images,
      data.createdAt,
      data.updatedAt,
      data.description,
      data.category,
      data.status,
    );
  }

  static validateCreation(input: CreateProductInput): void {
    const result = CreateProductSchema.safeParse(input);

    if (!result.success) {
      const errors = result.error.issues.map((err: z.core.$ZodIssue) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      throw new DomainValidationError(
        "Invalid Product creation data",
        errors,
      );
    }
  }

  static validateUpdate(input: UpdateProductInput): void {
    const result = UpdateProductSchema.safeParse(input);

    if (!result.success) {
      const errors = result.error.issues.map((err: z.core.$ZodIssue) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      throw new DomainValidationError("Invalid Product update data", errors);
    }
  }

  updateName(newName: string): ProductEntity {
    ProductEntity.validateUpdate({ name: newName });

    return new ProductEntity(
      this.id,
      newName,
      this.price,
      this.stock,
      this.images,
      this.createdAt,
      new Date(),
      this.description,
      this.category,
      this.status,
    );
  }

  updatePrice(newPrice: number): ProductEntity {
    ProductEntity.validateUpdate({ price: newPrice });

    return new ProductEntity(
      this.id,
      this.name,
      newPrice,
      this.stock,
      this.images,
      this.createdAt,
      new Date(),
      this.description,
      this.category,
      this.status,
    );
  }

  updateStock(newStock: number): ProductEntity {
    ProductEntity.validateUpdate({ stock: newStock });

    return new ProductEntity(
      this.id,
      this.name,
      this.price,
      newStock,
      this.images,
      this.createdAt,
      new Date(),
      this.description,
      this.category,
      this.status,
    );
  }

  addImage(imageUrl: string): ProductEntity {
    const newImages = [...this.images, imageUrl];
    ProductEntity.validateUpdate({ images: newImages });

    return new ProductEntity(
      this.id,
      this.name,
      this.price,
      this.stock,
      newImages,
      this.createdAt,
      new Date(),
      this.description,
      this.category,
      this.status,
    );
  }

  removeImage(imageUrl: string): ProductEntity {
    const newImages = this.images.filter((img) => img !== imageUrl);
    ProductEntity.validateUpdate({ images: newImages });

    return new ProductEntity(
      this.id,
      this.name,
      this.price,
      this.stock,
      newImages,
      this.createdAt,
      new Date(),
      this.description,
      this.category,
      this.status,
    );
  }

  updateStatus(newStatus: 'active' | 'inactive' | 'out_of_stock'): ProductEntity {
    ProductEntity.validateUpdate({ status: newStatus });

    return new ProductEntity(
      this.id,
      this.name,
      this.price,
      this.stock,
      this.images,
      this.createdAt,
      new Date(),
      this.description,
      this.category,
      newStatus,
    );
  }

  isInStock(): boolean {
    return this.stock > 0 && this.status === 'active';
  }

  isLowStock(threshold: number = 10): boolean {
    return this.stock <= threshold && this.stock > 0;
  }

  canBeDeleted(): boolean {
    return this.status === 'inactive' || this.stock === 0;
  }

  toJSON(): Product {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      stock: this.stock,
      images: this.images,
      category: this.category,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export class DomainValidationError extends Error {
  constructor(
    message: string,
    public readonly details: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = "DomainValidationError";
  }
}






