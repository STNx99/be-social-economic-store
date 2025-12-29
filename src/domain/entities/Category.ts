import {
  CreateCategorySchema,
  CreateCategoryInput,
  UpdateCategorySchema,
  UpdateCategoryInput,
  Category,
} from "@/utils/schemas/category";

export class CategoryEntity implements Category {
  private idValue: string;
  private nameValue: string;
  private descriptionValue?: string;
  private slugValue: string;
  private createdAtValue: Date;
  private updatedAtValue: Date;

  constructor(
    id: string,
    name: string,
    slug: string,
    description?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.idValue = id;
    this.nameValue = name;
    this.slugValue = slug;
    this.descriptionValue = description;
    this.createdAtValue = createdAt ?? new Date();
    this.updatedAtValue = updatedAt ?? new Date();
  }

  get id(): string {
    return this.idValue;
  }

  get name(): string {
    return this.nameValue;
  }

  get description(): string | undefined {
    return this.descriptionValue;
  }

  get slug(): string {
    return this.slugValue;
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

  set slug(value: string) {
    this.slugValue = value;
    this.updatedAtValue = new Date();
  }

  toJSON(): Category {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      slug: this.slug,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromValidatedData(data: Category): CategoryEntity {
    return new CategoryEntity(
      data.id,
      data.name,
      data.slug,
      data.description,
      data.createdAt,
      data.updatedAt,
    );
  }

  static validateCreation(data: CreateCategoryInput): void {
    const result = CreateCategorySchema.safeParse(data);
    if (!result.success) {
      throw new DomainValidationError(
        "Invalid category creation data",
        result.error.issues.map((err) => ({
          field: Array.isArray(err.path) && err.path.length > 0
            ? err.path.join(".")
            : "value",
          message: err.message,
        })),
      );
    }
  }

  static validateUpdate(data: UpdateCategoryInput): void {
    const result = UpdateCategorySchema.safeParse(data);
    if (!result.success) {
      throw new DomainValidationError(
        "Invalid category update data",
        result.error.issues.map((err) => ({
          field: Array.isArray(err.path) && err.path.length > 0
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

