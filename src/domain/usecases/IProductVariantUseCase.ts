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

export interface IProductVariantUseCase {
  createVariant(
    request: CreateProductVariantRequest,
    userId: string,
  ): Promise<CreateProductVariantResponse>;

  getVariant(
    request: GetProductVariantRequest,
  ): Promise<GetProductVariantResponse>;

  updateVariant(
    id: string,
    request: UpdateProductVariantRequest,
    userId: string,
  ): Promise<UpdateProductVariantResponse>;

  deleteVariant(
    request: DeleteProductVariantRequest,
    userId: string,
  ): Promise<DeleteProductVariantResponse>;

  listVariantsByProduct(
    request: ListProductVariantsRequest,
  ): Promise<ListProductVariantsResponse>;
}