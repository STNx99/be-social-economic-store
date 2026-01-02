import {
  ProductEntity,
  DomainValidationError,
} from "@/domain/entities/Product";
import { ICategoryRepository } from "@/domain/repositories/ICategoryRepository";
import { IProductRepository } from "@/domain/repositories/IProductRepository";
import { S3Service } from "@/infrastructure/s3/s3Service";
import { validateData, ValidationError, StatusBuilder } from "@/utils";
import {
  CreateProductRequest,
  CreateProductResponse,
  GetProductRequest,
  GetProductResponse,
  UpdateProductRequest,
  UpdateProductResponse,
  DeleteProductRequest,
  DeleteProductResponse,
  ListProductsRequest,
  ListProductsResponse,
  GeneratePresignedUrlRequest,
  GeneratePresignedUrlResponse,
} from "@/utils/schemas/endpoints/products";
import {
  CreateProductInput,
  UpdateProductInput,
  UpdateProductSchema,
  SanitizedProductInputSchema,
  ProductIdParamSchema,
  Product,
} from "@/utils/schemas/product";
import { IProductUseCase } from "@/domain/usecases/IProductUseCase";

const normalizeCategorySlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

export class ProductUseCase implements IProductUseCase {
  constructor(
    private productRepository: IProductRepository,
    private s3Service: S3Service,
    private categoryRepository: ICategoryRepository,
  ) {}

  async createProduct(
    request: CreateProductRequest,
    sellerId: string,
  ): Promise<CreateProductResponse> {
    try {
      let validatedInput: CreateProductInput;
      try {
        validatedInput = validateData(SanitizedProductInputSchema, {
          ...request,
          sellerId,
        });
      } catch (error) {
        if (error instanceof ValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }

      try {
        ProductEntity.validateCreation(validatedInput);
      } catch (error) {
        if (error instanceof DomainValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }
      if (validatedInput.category) {
        const normalizedCategorySlug = normalizeCategorySlug(
          validatedInput.category,
        );
        if (!normalizedCategorySlug) {
          return StatusBuilder.fail("Validation failed", [
            {
              field: "category",
              message: "Category slug must contain alphanumeric characters",
            },
          ]);
        }

        const referencedCategory = await this.categoryRepository.findBySlug(
          normalizedCategorySlug,
        );
        if (!referencedCategory) {
          return StatusBuilder.fail("Category not found", [
            {
              field: "category",
              message: "No category exists with the provided slug",
            },
          ]);
        }

        validatedInput.category = normalizedCategorySlug;
      }

      const product = new ProductEntity(
        crypto.randomUUID(),
        validatedInput.sellerId,
        validatedInput.name,
        validatedInput.price,
        validatedInput.stock,
        validatedInput.images || [],
        validatedInput.description,
        validatedInput.category,
        validatedInput.status || "pending",
      );

      const savedProduct = await this.productRepository.save(product.toJSON());

      return StatusBuilder.ok(savedProduct);
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
            "DynamoDB table does not exist. Please create the Products table first.",
        );
      }

      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async getProduct(
    request: GetProductRequest,
    userId?: string,
    role?: string,
  ): Promise<GetProductResponse> {
    try {
      let validatedParams;
      try {
        validatedParams = validateData(ProductIdParamSchema, {
          id: request.id,
        });
      } catch (error) {
        if (error instanceof ValidationError) {
          return StatusBuilder.fail("Invalid product ID", error.details);
        }
        throw error;
      }

      const product = await this.productRepository.findById(validatedParams.id);

      if (!product) {
        return StatusBuilder.fail("Product not found", [
          {
            field: "id",
            message: "No product exists with the provided ID",
          },
        ]);
      }

      if (role !== "admin") {
        const isOwner = userId && product.sellerId === userId;
        const isActive = product.status === "active";

        if (!isOwner && !isActive) {
          return StatusBuilder.fail("Product not found", [
            {
              field: "id",
              message: "No product exists with the provided ID",
            },
          ]);
        }
      }

      return StatusBuilder.ok(product);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async updateProduct(
    id: string,
    request: UpdateProductRequest,
    userId: string,
  ): Promise<UpdateProductResponse> {
    try {
      let validatedParams;
      try {
        validatedParams = validateData(ProductIdParamSchema, { id });
      } catch (error) {
        if (error instanceof ValidationError) {
          return StatusBuilder.fail("Invalid product ID", error.details);
        }
        throw error;
      }

      const existingProduct = await this.productRepository.findById(
        validatedParams.id,
      );

      if (!existingProduct) {
        return StatusBuilder.fail("Product not found", [
          {
            field: "id",
            message: "No product exists with the provided ID",
          },
        ]);
      }

      if (existingProduct.sellerId !== userId) {
        return StatusBuilder.fail("Forbidden: You do not own this product", [
          {
            field: "sellerId",
            message: "Only the product owner can update it",
          },
        ]);
      }

      let validatedUpdate: UpdateProductInput;
      try {
        validatedUpdate = validateData(
          UpdateProductSchema,
          request,
        ) as UpdateProductInput;
        ProductEntity.validateUpdate(validatedUpdate);
      } catch (error) {
        if (
          error instanceof ValidationError ||
          error instanceof DomainValidationError
        ) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }
      if (validatedUpdate.category !== undefined) {
        const normalizedCategorySlug = normalizeCategorySlug(
          validatedUpdate.category,
        );
        if (!normalizedCategorySlug) {
          return StatusBuilder.fail("Validation failed", [
            {
              field: "category",
              message: "Category slug must contain alphanumeric characters",
            },
          ]);
        }

        const referencedCategory = await this.categoryRepository.findBySlug(
          normalizedCategorySlug,
        );
        if (!referencedCategory) {
          return StatusBuilder.fail("Category not found", [
            {
              field: "category",
              message: "No category exists with the provided slug",
            },
          ]);
        }

        validatedUpdate.category = normalizedCategorySlug;
      }

      const updatedProduct = ProductEntity.fromValidatedData(existingProduct);

      if (validatedUpdate.name !== undefined) {
        updatedProduct.name = validatedUpdate.name;
      }
      if (validatedUpdate.price !== undefined) {
        updatedProduct.price = validatedUpdate.price;
      }
      if (validatedUpdate.stock !== undefined) {
        updatedProduct.stock = validatedUpdate.stock;
      }
      if (validatedUpdate.images !== undefined) {
        updatedProduct.images = validatedUpdate.images;
      }
      if (validatedUpdate.description !== undefined) {
        updatedProduct.description = validatedUpdate.description;
      }
      if (validatedUpdate.category !== undefined) {
        updatedProduct.category = validatedUpdate.category;
      }
      if (validatedUpdate.status !== undefined) {
        updatedProduct.status = validatedUpdate.status;
      }

      const savedProduct = await this.productRepository.save(
        updatedProduct.toJSON(),
      );

      return StatusBuilder.ok(savedProduct);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async deleteProduct(
    request: DeleteProductRequest,
    userId: string,
  ): Promise<DeleteProductResponse> {
    try {
      let validatedParams;
      try {
        validatedParams = validateData(ProductIdParamSchema, {
          id: request.id,
        });
      } catch (error) {
        if (error instanceof ValidationError) {
          return StatusBuilder.fail("Invalid product ID", error.details);
        }
        throw error;
      }

      const product = await this.productRepository.findById(validatedParams.id);

      if (!product) {
        return StatusBuilder.fail("Product not found", [
          {
            field: "id",
            message: "No product exists with the provided ID",
          },
        ]);
      }

      if (product.sellerId !== userId) {
        return StatusBuilder.fail("Forbidden: You do not own this product", [
          {
            field: "sellerId",
            message: "Only the product owner can delete it",
          },
        ]);
      }

      const deleted = await this.productRepository.delete(validatedParams.id);

      if (!deleted) {
        return StatusBuilder.fail("Failed to delete product");
      }

      return StatusBuilder.ok(undefined);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async listProducts(
    request: ListProductsRequest,
    userId?: string,
    role?: string,
  ): Promise<ListProductsResponse> {
    try {
      const page = request.page || 1;
      const limit = request.limit || 10;
      const skip = (page - 1) * limit;

      let categoryFilter = request.category;
      if (categoryFilter && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryFilter)) {
        const category = await this.categoryRepository.findById(categoryFilter);
        if (category) {
          categoryFilter = category.slug;
        }
      }

      const products = await this.productRepository.list({
        category: categoryFilter,
        status: request.status,
        search: request.search,
        isAdmin: role === "admin",
      });

      if (request.sortBy) {
        const sortBy = request.sortBy as keyof Product;
        const sortOrder = request.sortOrder === "desc" ? -1 : 1;
        products.sort((a, b) => {
          const valA = a[sortBy];
          const valB = b[sortBy];
          if (valA === undefined || valB === undefined) return 0;
          if (valA < valB) return -1 * sortOrder;
          if (valA > valB) return 1 * sortOrder;
          return 0;
        });
      }

      const total = products.length;
      const paginatedProducts = products.slice(skip, skip + limit);
      const totalPages = Math.ceil(total / limit);

      return StatusBuilder.paginated(paginatedProducts, {
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

  async listUserProducts(
    request: ListProductsRequest,
    userId: string,
  ): Promise<ListProductsResponse> {
    try {
      const page = request.page || 1;
      const limit = request.limit || 10;
      const skip = (page - 1) * limit;

      let categoryFilter = request.category;
      if (categoryFilter && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryFilter)) {
        const category = await this.categoryRepository.findById(categoryFilter);
        if (category) {
          categoryFilter = category.slug;
        }
      }

      const products = await this.productRepository.findBySellerId(userId, {
        category: categoryFilter,
        status: request.status,
        search: request.search,
      });

      if (request.sortBy) {
        const sortBy = request.sortBy as keyof Product;
        const sortOrder = request.sortOrder === "desc" ? -1 : 1;
        products.sort((a, b) => {
          const valA = a[sortBy];
          const valB = b[sortBy];
          if (valA === undefined || valB === undefined) return 0;
          if (valA < valB) return -1 * sortOrder;
          if (valA > valB) return 1 * sortOrder;
          return 0;
        });
      }

      const total = products.length;
      const paginatedProducts = products.slice(skip, skip + limit);
      const totalPages = Math.ceil(total / limit);

      return StatusBuilder.paginated(paginatedProducts, {
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

  async generatePresignedUrl(
    request: GeneratePresignedUrlRequest,
  ): Promise<GeneratePresignedUrlResponse> {
    try {
      const result = await this.s3Service.generatePresignedUrl({
        fileName: request.fileName,
        contentType: request.contentType,
        folder: "products",
      });

      return StatusBuilder.ok(result);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async approveProduct(
    id: string,
    status: "active" | "rejected",
  ): Promise<UpdateProductResponse> {
    try {
      let validatedParams;
      try {
        validatedParams = validateData(ProductIdParamSchema, { id });
      } catch (error) {
        if (error instanceof ValidationError) {
          return StatusBuilder.fail("Invalid product ID", error.details);
        }
        throw error;
      }

      const existingProduct = await this.productRepository.findById(
        validatedParams.id,
      );

      if (!existingProduct) {
        return StatusBuilder.fail("Product not found", [
          {
            field: "id",
            message: "No product exists with the provided ID",
          },
        ]);
      }

      const updatedProduct = ProductEntity.fromValidatedData(existingProduct);
      updatedProduct.status = status;

      const savedProduct = await this.productRepository.save(
        updatedProduct.toJSON(),
      );

      return StatusBuilder.ok(savedProduct);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async deleteImage(key: string): Promise<DeleteProductResponse> {
    try {
      await this.s3Service.deleteFile(key);
      return StatusBuilder.ok(undefined);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}