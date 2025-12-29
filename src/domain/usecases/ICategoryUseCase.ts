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

export interface ICategoryUseCase {
  createCategory(request: CreateCategoryRequest): Promise<CreateCategoryResponse>;
  getCategory(request: GetCategoryRequest): Promise<GetCategoryResponse>;
  updateCategory(id: string, request: UpdateCategoryRequest): Promise<UpdateCategoryResponse>;
  deleteCategory(request: DeleteCategoryRequest): Promise<DeleteCategoryResponse>;
  listCategories(request: ListCategoriesRequest): Promise<ListCategoriesResponse>;
}

