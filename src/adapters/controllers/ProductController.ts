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
      const body = await c.req.json();
      const response = await this.productUseCase.createProduct(
        body as CreateProductRequest,
      );

      if (response.success) {
        return c.json(response, 201);
      } else {
        return c.json(response, 400);
      }
    } catch (error) {
      console.error(error);
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "lỗi"),
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
    } catch (error) {
      console.error(error); // lỗi sever
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "lỗi"),
        500,
      );
    }
  }

  async updateProduct(c: Context) {
    try {
      const id = c.req.param("id");
      const body = await c.req.json();
      const response = await this.productUseCase.updateProduct(
        id,
        body as UpdateProductRequest,
      );

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error) {
      console.error(error); // lỗi sever
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "rồi luôn server căng cọt",
        ),
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
    } catch (error) {
      console.error(error); // lỗi sever
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "gg"),
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
    } catch (error) {
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "gg"),
        500,
      );
    }
  }

  async generatePresignedUrl(c: Context) {
    try {
      const body = await c.req.json();
      const request = body as GeneratePresignedUrlRequest;

      const response = await this.productUseCase.generatePresignedUrl(request);

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error) {
      console.error(error); // lỗi sever
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "gg"),
        500,
      );
    }
  }
}
