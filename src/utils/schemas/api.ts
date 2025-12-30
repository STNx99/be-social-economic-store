// Re-export response schemas
export {
  ValidationErrorDetailSchema,
  BaseResponseSchema,
  SuccessResponseSchema,
  ErrorResponseSchema,
  ValidationErrorSchema,
  BadRequestResponseSchema,
  UnauthorizedResponseSchema,
  ForbiddenResponseSchema,
  NotFoundResponseSchema,
  InternalServerErrorResponseSchema,
  createSuccessResponseSchema,
  createErrorResponseSchema,
  createEndpointResponseSchema,
  type ValidationErrorDetail,
  type BaseResponse,
  type BadRequestResponse,
  type UnauthorizedResponse,
  type ForbiddenResponse,
  type NotFoundResponse,
  type InternalServerErrorResponse,
} from "./responses";

// Re-export pagination schemas
export {
  PaginationQuerySchema,
  PaginationMetaSchema,
  PaginatedResponseSchema,
  createPaginatedResponseSchema,
  type PaginationQuery,
  type PaginationMeta,
} from "./queries";

// Re-export search schemas
export {
  SearchQuerySchema,
  type SearchQuery,
} from "./queries";

// Re-export endpoint schemas
export {
  // Auth
  AuthLoginRequestSchema,
  AuthLoginResponseSchema,
  AuthRegisterRequestSchema,
  AuthRegisterResponseSchema,
  type AuthLoginRequest,
  type AuthLoginResponse,
  type AuthRegisterRequest,
  type AuthRegisterResponse,

  // Users
  CreateUserRequestSchema,
  CreateUserResponseSchema,
  GetUserRequestSchema,
  GetUserResponseSchema,
  type CreateUserRequest,
  type CreateUserResponse,
  type GetUserRequest,
  type GetUserResponse,

  // Products
  CreateProductRequestSchema,
  CreateProductResponseSchema,
  GetProductRequestSchema,
  GetProductResponseSchema,
  UpdateProductRequestSchema,
  UpdateProductResponseSchema,
  DeleteProductRequestSchema,
  DeleteProductResponseSchema,
  ListProductsRequestSchema,
  ListProductsResponseSchema,
  type CreateProductRequest,
  type CreateProductResponse,
  type GetProductRequest,
  type GetProductResponse,
  type UpdateProductRequest,
  type UpdateProductResponse,
  type DeleteProductRequest,
  type DeleteProductResponse,
  type ListProductsRequest,
  type ListProductsResponse,

  // Categories
  CreateCategoryRequestSchema,
  CreateCategoryResponseSchema,
  GetCategoryRequestSchema,
  GetCategoryResponseSchema,
  UpdateCategoryRequestSchema,
  UpdateCategoryResponseSchema,
  DeleteCategoryRequestSchema,
  DeleteCategoryResponseSchema,
  ListCategoriesRequestSchema,
  ListCategoriesResponseSchema,
  type CreateCategoryRequest,
  type CreateCategoryResponse,
  type GetCategoryRequest,
  type GetCategoryResponse,
  type UpdateCategoryRequest,
  type UpdateCategoryResponse,
  type DeleteCategoryRequest,
  type DeleteCategoryResponse,
  type ListCategoriesRequest,
  type ListCategoriesResponse,
} from "./endpoints";