import {
  CreateProductSchema,
  CreateProductInput,
  UpdateProductSchema,
  UpdateProductInput,
  Product,
} from "@/utils/schemas/product";
import { ProductStatus } from "@/utils/schemas/endpoints/products";
import { ProductVariant } from "@/utils/schemas/productVariant";

export class ProductEntity implements Product {
  private idValue: string;
  private sellerIdValue: string;
  private nameValue: string;
  private descriptionValue?: string;
  private priceValue: number;
  private stockValue: number;
  private imagesValue: string[];
  private categoryValue?: string;
  private statusValue: ProductStatus;
  private variantsValue: ProductVariant[];
  private createdAtValue: Date;
  private updatedAtValue: Date;

  constructor(
    id: string,
    sellerId: string,
    name: string,
    price: number,
    stock: number,
    images: string[] = [],
    description?: string,
    category?: string,
    status: ProductStatus = "pending",
    variants: ProductVariant[] = [],
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.idValue = id;
    this.sellerIdValue = sellerId;
    this.nameValue = name;
    this.priceValue = price;
    this.stockValue = stock;
    this.imagesValue = images;
    this.descriptionValue = description;
    this.categoryValue = category;
    this.statusValue = status;
    this.variantsValue = variants;
    this.createdAtValue = createdAt ?? new Date();
    this.updatedAtValue = updatedAt ?? new Date();
  }

  get id(): string {
    return this.idValue;
  }

  get sellerId(): string {
    return this.sellerIdValue;
  }

  get name(): string {
    return this.nameValue;
  }

  get description(): string | undefined {
    return this.descriptionValue;
  }

  get price(): number {
    return this.priceValue;
  }

  get stock(): number {
    return this.stockValue;
  }

  get images(): string[] {
    return this.imagesValue;
  }

  get category(): string | undefined {
    return this.categoryValue;
  }

  get status(): ProductStatus {
    return this.statusValue;
  }

  get variants(): ProductVariant[] {
    return this.variantsValue;
  }

  get createdAt(): Date {
    return this.createdAtValue;
  }

  get updatedAt(): Date {
    return this.updatedAtValue;
  }

  set name(value: string) {
    this.nameValue = value;
    this.updatedAtValue = new Date();
  }

  set description(value: string | undefined) {
    this.descriptionValue = value;
    this.updatedAtValue = new Date();
  }

  set price(value: number) {
    this.priceValue = value;
    this.updatedAtValue = new Date();
  }

  set stock(value: number) {
    this.stockValue = value;
    this.updatedAtValue = new Date();
  }

  set images(value: string[]) {
    this.imagesValue = value;
    this.updatedAtValue = new Date();
  }

  set category(value: string | undefined) {
    this.categoryValue = value;
    this.updatedAtValue = new Date();
  }

  set status(value: ProductStatus) {
    this.statusValue = value;
    this.updatedAtValue = new Date();
  }

  set variants(value: ProductVariant[]) {
    this.variantsValue = value;
    this.updatedAtValue = new Date();
  }

  isInStock(): boolean {
    return this.stockValue > 0 && this.statusValue === "active";
  }

  isLowStock(threshold: number = 10): boolean {
    return this.stockValue > 0 && this.stockValue <= threshold;
  }

  canBeDeleted(): boolean {
    return (
      this.statusValue === "inactive" ||
      this.statusValue === "archived" ||
      this.stockValue === 0
    );
  }

  toJSON(): Product {
    return {
      id: this.id,
      sellerId: this.sellerId,
      name: this.name,
      description: this.description,
      price: this.price,
      stock: this.stock,
      images: this.images,
      category: this.category,
      status: this.status,
      variants: this.variants,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromValidatedData(data: Product): ProductEntity {
    return new ProductEntity(
      data.id,
      data.sellerId,
      data.name,
      data.price,
      data.stock,
      data.images,
      data.description,
      data.category,
      data.status,
      data.variants || [],
      data.createdAt,
      data.updatedAt,
    );
  }

  static validateCreation(data: CreateProductInput): void {
    const result = CreateProductSchema.safeParse(data);
    if (!result.success) {
      throw new DomainValidationError(
        "Invalid product creation data",
        result.error.issues.map((err) => ({
          field:
            Array.isArray(err.path) && err.path.length > 0
              ? err.path.join(".")
              : "value",
          message: err.message,
        })),
      );
    }
  }

  static validateUpdate(data: UpdateProductInput): void {
    const result = UpdateProductSchema.safeParse(data);
    if (!result.success) {
      throw new DomainValidationError(
        "Invalid product update data",
        result.error.issues.map((err) => ({
          field:
            Array.isArray(err.path) && err.path.length > 0
              ? err.path.join(".")
              : "value",
          message: err.message,
        })),
      );
    }
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