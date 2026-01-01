import { IProductVariantUseCase } from "@/domain/usecases/IProductVariantUseCase";
import { IProductVariantRepository } from "@/domain/repositories/IProductVariantRepository";
import { IProductRepository } from "@/domain/repositories/IProductRepository";
import { StatusBuilder, validateData, ValidationError } from "@/utils";
import {
  CreateProductVariantRequest,
  CreateProductVariantResponse,
  GetProductVariantRequest,
  GetProductVariantResponse,
  UpdateProductVariantRequest,
  UpdateProductVariantResponse,
  DeleteProductVariantRequest,
  DeleteProductVariantResponse,
  ListProductVariantsRequest,
  ListProductVariantsResponse,
} from "@/utils/schemas/endpoints/productVariants";
import {
  CreateProductVariantSchema,
  UpdateProductVariantSchema,
  ProductVariantIdParamSchema,
} from "@/utils/schemas/productVariant";

export class ProductVariantUseCase implements IProductVariantUseCase {
  constructor(
    private variantRepository: IProductVariantRepository,
    private productRepository: IProductRepository,
  ) {}

  async createVariant(
    request: CreateProductVariantRequest,
    userId: string,
  ): Promise<CreateProductVariantResponse> {
    try {
      const validatedInput = validateData(CreateProductVariantSchema, request);

      // Check if product exists and user is the owner
      const product = await this.productRepository.findById(validatedInput.productId);
      if (!product) {
        return StatusBuilder.fail("Product not found");
      }

      if (product.sellerId !== userId) {
        return StatusBuilder.fail("Forbidden: You do not own this product");
      }

      // Check if SKU already exists
      const existingSku = await this.variantRepository.findBySku(validatedInput.sku);
      if (existingSku) {
        return StatusBuilder.fail("SKU already exists", [
          { field: "sku", message: "A variant with this SKU already exists" },
        ]);
      }

      const variant = {
        ...validatedInput,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const savedVariant = await this.variantRepository.save(variant);
      return StatusBuilder.ok(savedVariant);
    } catch (error) {
      if (error instanceof ValidationError) {
        return StatusBuilder.fail("Validation failed", error.details);
      }
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async getVariant(
    request: GetProductVariantRequest,
  ): Promise<GetProductVariantResponse> {
    try {
      const validatedParams = validateData(ProductVariantIdParamSchema, request);
      const variant = await this.variantRepository.findById(validatedParams.id);

      if (!variant) {
        return StatusBuilder.fail("Product variant not found");
      }

      return StatusBuilder.ok(variant);
    } catch (error) {
      if (error instanceof ValidationError) {
        return StatusBuilder.fail("Invalid variant ID", error.details);
      }
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async updateVariant(
    id: string,
    request: UpdateProductVariantRequest,
    userId: string,
  ): Promise<UpdateProductVariantResponse> {
    try {
      const validatedParams = validateData(ProductVariantIdParamSchema, { id });
      const validatedUpdate = validateData(UpdateProductVariantSchema, request);

      const existingVariant = await this.variantRepository.findById(validatedParams.id);
      if (!existingVariant) {
        return StatusBuilder.fail("Product variant not found");
      }

      // Check product ownership
      const product = await this.productRepository.findById(existingVariant.productId);
      if (!product || product.sellerId !== userId) {
        return StatusBuilder.fail("Forbidden: You do not own the product for this variant");
      }

      // Check SKU uniqueness if it's being updated
      if (validatedUpdate.sku && validatedUpdate.sku !== existingVariant.sku) {
        const existingSku = await this.variantRepository.findBySku(validatedUpdate.sku);
        if (existingSku) {
          return StatusBuilder.fail("SKU already exists", [
            { field: "sku", message: "A variant with this SKU already exists" },
          ]);
        }
      }

      const updatedVariant = {
        ...existingVariant,
        ...validatedUpdate,
        updatedAt: new Date(),
      };

      const savedVariant = await this.variantRepository.save(updatedVariant);
      return StatusBuilder.ok(savedVariant);
    } catch (error) {
      if (error instanceof ValidationError) {
        return StatusBuilder.fail("Validation failed", error.details);
      }
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async deleteVariant(
    request: DeleteProductVariantRequest,
    userId: string,
  ): Promise<DeleteProductVariantResponse> {
    try {
      const validatedParams = validateData(ProductVariantIdParamSchema, request);
      const variant = await this.variantRepository.findById(validatedParams.id);

      if (!variant) {
        return StatusBuilder.fail("Product variant not found");
      }

      // Check product ownership
      const product = await this.productRepository.findById(variant.productId);
      if (!product || product.sellerId !== userId) {
        return StatusBuilder.fail("Forbidden: You do not own the product for this variant");
      }

      const deleted = await this.variantRepository.delete(validatedParams.id);
      if (!deleted) {
        return StatusBuilder.fail("Failed to delete product variant");
      }

      return StatusBuilder.ok(undefined);
    } catch (error) {
      if (error instanceof ValidationError) {
        return StatusBuilder.fail("Invalid variant ID", error.details);
      }
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async listVariantsByProduct(
    request: ListProductVariantsRequest,
  ): Promise<ListProductVariantsResponse> {
    try {
      if (!request.productId) {
        return StatusBuilder.fail("Product ID is required");
      }

      const variants = await this.variantRepository.findByProductId(request.productId);
      return StatusBuilder.ok(variants);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}