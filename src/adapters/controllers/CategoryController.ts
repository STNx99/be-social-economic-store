import { Context } from "hono";

import {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  DeleteCategoryRequest,
  ListCategoriesRequest,
} from "@/utils/schemas/endpoints/categories";
import { ICategoryUseCase } from "@/domain/usecases/ICategoryUseCase";
import { StatusBuilder } from "@/utils";

export class CategoryController {
  constructor(private categoryUseCase: ICategoryUseCase) {}

  async createCategory(c: Context) {
    try {
      const body = await c.req.json();
      const response = await this.categoryUseCase.createCategory(
        body as CreateCategoryRequest,
      );

      if (response.success) {
        return c.json(response, 201);
      } else {
        return c.json(response, 400);
      }
    } catch (error) {
      console.error(error);
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "error"),
        500,
      );
    }
  }

  async getCategory(c: Context) {
    try {
      const id = c.req.param("id");
      const response = await this.categoryUseCase.getCategory({ id });

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 404);
      }
    } catch (error) {
      console.error(error);
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "error"),
        500,
      );
    }
  }

  async updateCategory(c: Context) {
    try {
      const id = c.req.param("id");
      const body = await c.req.json();
      const response = await this.categoryUseCase.updateCategory(
        id,
        body as UpdateCategoryRequest,
      );

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error) {
      console.error(error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "rồi luôn server căng cọt",
        ),
        500,
      );
    }
  }

  async deleteCategory(c: Context) {
    try {
      const id = c.req.param("id");
      const response = await this.categoryUseCase.deleteCategory({ id });

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 404);
      }
    } catch (error) {
      console.error(error);
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "gg"),
        500,
      );
    }
  }

  async listCategories(c: Context) {
    try {
      const query = c.req.query();
      const request: ListCategoriesRequest = {
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 10,
      };

      const response = await this.categoryUseCase.listCategories(request);

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error) {
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "gg"),
        500,
      );
    }
  }
}

