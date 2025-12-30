import {
  CategoryEntity,
  DomainValidationError,
} from "@/domain/entities/Category";
import { ICategoryRepository } from "@/domain/repositories/ICategoryRepository";
import { validateData, ValidationError, StatusBuilder } from "@/utils";
import {
  CreateCategoryRequest,
  CreateCategoryResponse,
  GetCategoryRequest,
  GetCategoryResponse,
  UpdateCategoryRequest,
  UpdateCategoryResponse,
  DeleteCategoryRequest,
  DeleteCategoryResponse,
  ListCategoriesRequest,
  ListCategoriesResponse,
} from "@/utils/schemas/endpoints/categories";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  UpdateCategorySchema,
  SanitizedCategoryInputSchema,
  CategoryIdParamSchema,
  Category,
} from "@/utils/schemas/category";
import { ICategoryUseCase } from "@/domain/usecases/ICategoryUseCase";

export class CategoryUseCase implements ICategoryUseCase {
  constructor(
    private categoryRepository: ICategoryRepository,
  ) {}

  async createCategory(
    request: CreateCategoryRequest,
  ): Promise<CreateCategoryResponse> {
    try {
      let validatedInput: CreateCategoryInput;
      try {
        validatedInput = validateData(SanitizedCategoryInputSchema, request);
      } catch (error) {
        if (error instanceof ValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }

      if (!validatedInput.slug) {
        return StatusBuilder.fail("Slug is required", [
          {
            field: "slug",
            message: "Slug cannot be empty",
          },
        ]);
      }

      const existingCategory = await this.categoryRepository.findBySlug(validatedInput.slug);
      if (existingCategory) {
        return StatusBuilder.fail("Category with this slug already exists", [
          {
            field: "slug",
            message: "A category with this slug already exists",
          },
        ]);
      }

      try {
        CategoryEntity.validateCreation(validatedInput);
      } catch (error) {
        if (error instanceof DomainValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }

      const category = new CategoryEntity(
        crypto.randomUUID(),
        validatedInput.name,
        validatedInput.slug,
        validatedInput.description,
      );

      const savedCategory = await this.categoryRepository.save(category.toJSON());

      return StatusBuilder.ok(savedCategory);
    } catch (error: unknown) {
      if (error instanceof DomainValidationError) {
        return StatusBuilder.fail("Validation failed", error.details);
      }

      const err = error as { message?: string; name?: string };
      if (
        err?.message?.includes("does not exist") ||
        err?.name === "ResourceNotFoundException"
      ) {
        return StatusBuilder.fail(
          err.message ||
            "DynamoDB table does not exist",
        );
      }

      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async getCategory(request: GetCategoryRequest): Promise<GetCategoryResponse> {
    try {
      let validatedParams;
      try {
        validatedParams = validateData(CategoryIdParamSchema, {
          id: request.id,
        });
      } catch (error) {
        if (error instanceof ValidationError) {
          return StatusBuilder.fail("Invalid category ID", error.details);
        }
        throw error;
      }

      const category = await this.categoryRepository.findById(validatedParams.id);

      if (!category) {
        return StatusBuilder.fail("Category not found", [
          {
            field: "id",
            message: "No category exists with the provided ID",
          },
        ]);
      }

      return StatusBuilder.ok(category);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async updateCategory(
    id: string,
    request: UpdateCategoryRequest,
  ): Promise<UpdateCategoryResponse> {
    try {
      let validatedParams;
      try {
        validatedParams = validateData(CategoryIdParamSchema, { id });
      } catch (error) {
        if (error instanceof ValidationError) {
          return StatusBuilder.fail("Invalid category ID", error.details);
        }
        throw error;
      }

      const existingCategory = await this.categoryRepository.findById(
        validatedParams.id,
      );

      if (!existingCategory) {
        return StatusBuilder.fail("Category not found", [
          {
            field: "id",
            message: "No category exists with the provided ID",
          },
        ]);
      }

      let validatedUpdate: UpdateCategoryInput;
      try {
        validatedUpdate = validateData(
          UpdateCategorySchema,
          request,
        ) as UpdateCategoryInput;
        CategoryEntity.validateUpdate(validatedUpdate);
      } catch (error) {
        if (
          error instanceof ValidationError ||
          error instanceof DomainValidationError
        ) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }
      if (validatedUpdate.slug && validatedUpdate.slug !== existingCategory.slug) {
        const categoryWithSlug = await this.categoryRepository.findBySlug(validatedUpdate.slug);
        if (categoryWithSlug) {
          return StatusBuilder.fail("Category with this slug already exists", [
            {
              field: "slug",
              message: "A category with this slug already exists",
            },
          ]);
        }
      }

      const updatedCategory = CategoryEntity.fromValidatedData(existingCategory);

      if (validatedUpdate.name !== undefined) {
        updatedCategory.name = validatedUpdate.name;
      }
      if (validatedUpdate.description !== undefined) {
        updatedCategory.description = validatedUpdate.description;
      }
      if (validatedUpdate.slug !== undefined) {
        updatedCategory.slug = validatedUpdate.slug;
      }

      const savedCategory = await this.categoryRepository.save(
        updatedCategory.toJSON(),
      );

      return StatusBuilder.ok(savedCategory);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async deleteCategory(
    request: DeleteCategoryRequest,
  ): Promise<DeleteCategoryResponse> {
    try {
      let validatedParams;
      try {
        validatedParams = validateData(CategoryIdParamSchema, {
          id: request.id,
        });
      } catch (error) {
        if (error instanceof ValidationError) {
          return StatusBuilder.fail("Invalid category ID", error.details);
        }
        throw error;
      }

      const category = await this.categoryRepository.findById(validatedParams.id);

      if (!category) {
        return StatusBuilder.fail("Category not found", [
          {
            field: "id",
            message: "No category exists with the provided ID",
          },
        ]);
      }

      const deleted = await this.categoryRepository.delete(validatedParams.id);

      if (!deleted) {
        return StatusBuilder.fail("Failed to delete category");
      }

      return StatusBuilder.ok(undefined);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async listCategories(
    request: ListCategoriesRequest,
  ): Promise<ListCategoriesResponse> {
    try {
      const page = request.page || 1;
      const limit = request.limit || 10;
      const skip = (page - 1) * limit;

      const categories: Category[] = await this.categoryRepository.findAll();

      const total = categories.length;
      const paginatedCategories = categories.slice(skip, skip + limit);
      const totalPages = Math.ceil(total / limit);

      return StatusBuilder.paginated(paginatedCategories, {
        page,
        limit,
        total,
        totalPages,
      });
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}

