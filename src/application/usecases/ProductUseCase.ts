import { ProductEntity, DomainValidationError } from "@/domain/entities/Product";
import { IProductRepository } from "@/domain/repositories/IProductRepository";
import { validateData, ValidationError } from "@/utils/validation";
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
} from "@/utils/schemas/endpoints/products";
import { CreateProductInput, UpdateProductInput, UpdateProductSchema, SanitizedProductInputSchema, ProductIdParamSchema } from "@/utils/schemas/product";

interface IProductUseCase {
  createProduct(request: CreateProductRequest): Promise<CreateProductResponse>;
  getProduct(request: GetProductRequest): Promise<GetProductResponse>;
  updateProduct(
    id: string,
    request: UpdateProductRequest,
  ): Promise<UpdateProductResponse>;
  deleteProduct(request: DeleteProductRequest): Promise<DeleteProductResponse>;
  listProducts(request: ListProductsRequest): Promise<ListProductsResponse>;
}

export class ProductUseCase implements IProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async createProduct(
    request: CreateProductRequest,
  ): Promise<CreateProductResponse> {
    try {
      let validatedInput: CreateProductInput;
      try {
        validatedInput = validateData(SanitizedProductInputSchema, request);
      } catch (error) {
        if (error instanceof ValidationError) {
          return {
            success: false,
            error: "Validation failed",
            details: error.details,
          };
        }
        throw error;
      }

      try {
        ProductEntity.validateCreation(validatedInput);
      } catch (error) {
        if (error instanceof DomainValidationError) {
          return {
            success: false,
            error: "Validation failed",
            details: error.details,
          };
        }
        throw error;
      }

      const product = new ProductEntity(
        crypto.randomUUID(),
        validatedInput.name,
        validatedInput.price,
        validatedInput.stock,
        validatedInput.images || [],
        new Date(),
        new Date(),
        validatedInput.description,
        validatedInput.category,
        validatedInput.status || 'active',
      );

      const savedProduct = await this.productRepository.save(product);

      return {
        success: true,
        data: savedProduct,
      };
    } catch (error: any) {
      if (error instanceof DomainValidationError) {
        return {
          success: false,
          error: "Validation failed",
          details: error.details,
        };
      }

      // Check for DynamoDB errors
      if (error?.message?.includes('does not exist') || 
          error?.name === 'ResourceNotFoundException') {
        return {
          success: false,
          error: error.message || "DynamoDB table does not exist. Please create the Products table first.",
        };
      }

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async getProduct(request: GetProductRequest): Promise<GetProductResponse> {
    try {
      let validatedParams;
      try {
        validatedParams = validateData(ProductIdParamSchema, { id: request.id });
      } catch (error) {
        if (error instanceof ValidationError) {
          return {
            success: false,
            error: "Invalid product ID",
            details: error.details,
          };
        }
        throw error;
      }

      const product = await this.productRepository.findById(
        validatedParams.id,
      );

      if (!product) {
        return {
          success: false,
          error: "Product not found",
          details: [
            {
              field: "id",
              message: "No product exists with the provided ID",
            },
          ],
        };
      }

      return {
        success: true,
        data: product,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
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
          return {
            success: false,
            error: "Invalid product ID",
            details: error.details,
          };
        }
        throw error;
      }

      const existingProduct = await this.productRepository.findById(
        validatedParams.id,
      );

      if (!existingProduct) {
        return {
          success: false,
          error: "Product not found",
          details: [
            {
              field: "id",
              message: "No product exists with the provided ID",
            },
          ],
        };
      }

      let validatedUpdate: UpdateProductInput;
      try {
        validatedUpdate = validateData(UpdateProductSchema, request) as UpdateProductInput;
        ProductEntity.validateUpdate(validatedUpdate);
      } catch (error) {
        if (error instanceof ValidationError || error instanceof DomainValidationError) {
          return {
            success: false,
            error: "Validation failed",
            details:
              error instanceof ValidationError
                ? error.details
                : error.details,
          };
        }
        throw error;
      }

      const productEntity = ProductEntity.fromValidatedData(existingProduct);
      let updatedProduct = productEntity;

      if (validatedUpdate.name !== undefined) {
        updatedProduct = updatedProduct.updateName(validatedUpdate.name);
      }
      if (validatedUpdate.price !== undefined) {
        updatedProduct = updatedProduct.updatePrice(validatedUpdate.price);
      }
      if (validatedUpdate.stock !== undefined) {
        updatedProduct = updatedProduct.updateStock(validatedUpdate.stock);
      }
      if (validatedUpdate.images !== undefined) {
        updatedProduct = new ProductEntity(
          updatedProduct.id,
          updatedProduct.name,
          updatedProduct.price,
          updatedProduct.stock,
          validatedUpdate.images,
          updatedProduct.createdAt,
          new Date(),
          validatedUpdate.description ?? updatedProduct.description,
          validatedUpdate.category ?? updatedProduct.category,
          validatedUpdate.status ?? updatedProduct.status,
        );
      }
      if (validatedUpdate.description !== undefined) {
        updatedProduct = new ProductEntity(
          updatedProduct.id,
          updatedProduct.name,
          updatedProduct.price,
          updatedProduct.stock,
          updatedProduct.images,
          updatedProduct.createdAt,
          new Date(),
          validatedUpdate.description,
          validatedUpdate.category ?? updatedProduct.category,
          validatedUpdate.status ?? updatedProduct.status,
        );
      }
      if (validatedUpdate.category !== undefined) {
        updatedProduct = new ProductEntity(
          updatedProduct.id,
          updatedProduct.name,
          updatedProduct.price,
          updatedProduct.stock,
          updatedProduct.images,
          updatedProduct.createdAt,
          new Date(),
          updatedProduct.description,
          validatedUpdate.category,
          validatedUpdate.status ?? updatedProduct.status,
        );
      }
      if (validatedUpdate.status !== undefined) {
        updatedProduct = updatedProduct.updateStatus(validatedUpdate.status);
      }

      const savedProduct = await this.productRepository.save(
        updatedProduct.toJSON(),
      );

      return {
        success: true,
        data: savedProduct,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async deleteProduct(
    request: DeleteProductRequest,
  ): Promise<DeleteProductResponse> {
    try {
      let validatedParams;
      try {
        validatedParams = validateData(ProductIdParamSchema, { id: request.id });
      } catch (error) {
        if (error instanceof ValidationError) {
          return {
            success: false,
            error: "Invalid product ID",
            details: error.details,
          };
        }
        throw error;
      }

      const product = await this.productRepository.findById(
        validatedParams.id,
      );

      if (!product) {
        return {
          success: false,
          error: "Product not found",
          details: [
            {
              field: "id",
              message: "No product exists with the provided ID",
            },
          ],
        };
      }

      const deleted = await this.productRepository.delete(validatedParams.id);

      if (!deleted) {
        return {
          success: false,
          error: "Failed to delete product",
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async listProducts(
    request: ListProductsRequest,
  ): Promise<ListProductsResponse> {
    try {
      const page = request.page || 1;
      const limit = request.limit || 10;
      const skip = (page - 1) * limit;

      let products: any[];

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

      return {
        success: true,
        data: paginatedProducts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}

