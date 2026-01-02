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
  createProduct(
    request: CreateProductRequest,
    sellerId: string,
  ): Promise<CreateProductResponse>;
  getProduct(
    request: GetProductRequest,
    userId?: string,
    role?: string,
  ): Promise<GetProductResponse>;
  updateProduct(
    id: string,
    request: UpdateProductRequest,
    userId: string,
  ): Promise<UpdateProductResponse>;
  deleteProduct(
    request: DeleteProductRequest,
    userId: string,
  ): Promise<DeleteProductResponse>;
  listProducts(
    request: ListProductsRequest,
    userId?: string,
    role?: string,
  ): Promise<ListProductsResponse>;
  listUserProducts(
    request: ListProductsRequest,
    userId: string,
  ): Promise<ListProductsResponse>;
  generatePresignedUrl(
    request: GeneratePresignedUrlRequest,
  ): Promise<GeneratePresignedUrlResponse>;
  approveProduct(
    id: string,
    status: "active" | "rejected",
  ): Promise<UpdateProductResponse>;
  deleteImage(key: string): Promise<DeleteProductResponse>;
}