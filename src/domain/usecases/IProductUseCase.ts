import {
  CreateProductRequest,
  CreateProductResponse,
  DeleteProductRequest,
  DeleteProductResponse,
  GetProductRequest,
  GetProductResponse,
  ListProductsRequest,
  ListProductsResponse,
  UpdateProductRequest,
  UpdateProductResponse,
  GeneratePresignedUrlRequest,
  GeneratePresignedUrlResponse,
} from "@/utils/schemas/endpoints";

export interface IProductUseCase {
  createProduct(request: CreateProductRequest): Promise<CreateProductResponse>;
  getProduct(request: GetProductRequest): Promise<GetProductResponse>;
  updateProduct(
    id: string,
    request: UpdateProductRequest,
  ): Promise<UpdateProductResponse>;
  deleteProduct(request: DeleteProductRequest): Promise<DeleteProductResponse>;
  listProducts(request: ListProductsRequest): Promise<ListProductsResponse>;
  generatePresignedUrl(
    request: GeneratePresignedUrlRequest,
  ): Promise<GeneratePresignedUrlResponse>;
}