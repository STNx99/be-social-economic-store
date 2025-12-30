import {
  ProductEntity,
  DomainValidationError,
} from "@/domain/entities/Product";
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

export class ProductUseCase implements IProductUseCase {
  constructor(
    private productRepository: IProductRepository,
    private s3Service: S3Service,
  ) {}

  async createProduct(
    request: CreateProductRequest,
  ): Promise<CreateProductResponse> {
    try {
      let validatedInput: CreateProductInput;
      try {
        validatedInput = validateData(SanitizedProductInputSchema, request);
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

      const product = new ProductEntity(
        crypto.randomUUID(),
        validatedInput.name,
        validatedInput.price,
        validatedInput.stock,
        validatedInput.images || [],
        validatedInput.description,
        validatedInput.category,
        validatedInput.status || "pending",
        new Date(),
        new Date(),
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

  async getProduct(request: GetProductRequest): Promise<GetProductResponse> {
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
  ): Promise<ListProductsResponse> {
    try {
      const page = request.page || 1;
      const limit = request.limit || 10;
      const skip = (page - 1) * limit;

      let products: Product[];

      if (request.category) {
        products = await this.productRepository.findByCategory(
          request.category,
        );
      } else if (request.status) {
        products = await this.productRepository.findByStatus(request.status);
      } else if (request.search) {
        products = await this.productRepository.searchByName(request.search);
      } else {
        products = await this.productRepository.findAll();
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
}
