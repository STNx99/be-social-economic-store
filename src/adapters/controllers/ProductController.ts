import { Context } from "hono";
import {
  CreateProductRequest,
  UpdateProductRequest,
  DeleteProductRequest,
  ListProductsRequest,
  GeneratePresignedUrlRequest,
} from "@/utils/schemas/endpoints/products";
import { IProductUseCase } from "@/domain/usecases/IProductUseCase";
import { StatusBuilder } from "@/utils";

export class ProductController {
  constructor(private productUseCase: IProductUseCase) {}

  async createProduct(c: Context) {
    try {
      const body = await c.req.json() as CreateProductRequest;
      const response = await this.productUseCase.createProduct(body);

      if (response.success) {
        return c.json(response, 201);
      } else {
        return c.json(response, 400);
      }
    } catch (error: unknown) {
      const err = error as Error;
      return c.json(
        StatusBuilder.fail(err.message || "Internal Server Error"),
        500,
      );
    }
  }

  async getProduct(c: Context) {
    try {
      const id = c.req.param("id");
      const response = await this.productUseCase.getProduct({ id });

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 404);
      }
    } catch (error: unknown) {
      const err = error as Error;
      return c.json(
        StatusBuilder.fail(err.message || "Internal Server Error"),
        500,
      );
    }
  }

  async updateProduct(c: Context) {
    try {
      const id = c.req.param("id");
      const body = await c.req.json() as UpdateProductRequest;
      const response = await this.productUseCase.updateProduct(id, body);

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error: unknown) {
      const err = error as Error;
      return c.json(
        StatusBuilder.fail(err.message || "Internal Server Error"),
        500,
      );
    }
  }

  async deleteProduct(c: Context) {
    try {
      const id = c.req.param("id");
      const response = await this.productUseCase.deleteProduct({ id });

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 404);
      }
    } catch (error: unknown) {
      const err = error as Error;
      return c.json(
        StatusBuilder.fail(err.message || "Internal Server Error"),
        500,
      );
    }
  }

  async listProducts(c: Context) {
    try {
      const query = c.req.query();
      const request: ListProductsRequest = {
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 10,
        category: query.category,
        status: query.status as "active" | "inactive" | undefined,
        search: query.search,
      };

      const response = await this.productUseCase.listProducts(request);

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error: unknown) {
      const err = error as Error;
      return c.json(
        StatusBuilder.fail(err.message || "Internal Server Error"),
        500,
      );
    }
  }

  async generatePresignedUrl(c: Context) {
    try {
      const body = await c.req.json() as GeneratePresignedUrlRequest;
      const response = await this.productUseCase.generatePresignedUrl(body);

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error: unknown) {
      const err = error as Error;
      return c.json(
        StatusBuilder.fail(err.message || "Internal Server Error"),
        500,
      );
    }
  }
}