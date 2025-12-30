import { Context } from "hono";


import {
  CreateProductRequest,
  UpdateProductRequest,
  DeleteProductRequest,
  ListProductsRequest,
  GeneratePresignedUrlRequest,
  ProductStatus,
} from "@/utils/schemas/endpoints/products";
import { IProductUseCase } from "@/domain/usecases/IProductUseCase";
import { StatusBuilder } from "@/utils";

export class ProductController {
  constructor(private productUseCase: IProductUseCase) {}

  async createProduct(c: Context) {
    try {
      const userId = c.get("userId");
      if (!userId) {
        return c.json(StatusBuilder.fail("Unauthorized: User ID not found"), 401);
      }

      const body = await c.req.json();
      const response = await this.productUseCase.createProduct(
        body as CreateProductRequest,
        userId,
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

  async getProduct(c: Context) {
    try {
      const userId = c.get("userId");
      const role = c.get("role");
      const id = c.req.param("id");
      const response = await this.productUseCase.getProduct(
        { id },
        userId,
        role,
      );

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

  async updateProduct(c: Context) {
    try {
      const userId = c.get("userId");
      if (!userId) {
        return c.json(StatusBuilder.fail("Unauthorized: User ID not found"), 401);
      }

      const id = c.req.param("id");
      const body = await c.req.json();
      const response = await this.productUseCase.updateProduct(
        id,
        body as UpdateProductRequest,
        userId,
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

  async deleteProduct(c: Context) {
    try {
      const userId = c.get("userId");
      if (!userId) {
        return c.json(StatusBuilder.fail("Unauthorized: User ID not found"), 401);
      }

      const id = c.req.param("id");
      const response = await this.productUseCase.deleteProduct({ id }, userId);

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

  async listProducts(c: Context) {
    try {
      const userId = c.get("userId");
      const role = c.get("role");
      const query = c.req.query();
      const request: ListProductsRequest = {
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 10,
        category: query.category,
        status: query.status as ProductStatus | undefined,
        search: query.search,
      };

      const response = await this.productUseCase.listProducts(
        request,
        userId,
        role,
      );

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
      console.error(error);
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "gg"),
        500,
      );
    }
  }

  async approveProduct(c: Context) {
    try {
      const id = c.req.param("id");
      const body = await c.req.json();
      const { status } = body as { status: "active" | "rejected" };

      if (!status || (status !== "active" && status !== "rejected")) {
        return c.json(
          StatusBuilder.fail("Invalid status. Must be 'active' or 'rejected'"),
          400,
        );
      }

      const response = await this.productUseCase.approveProduct(id, status);

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error) {
      console.error(error);
      return c.json(
        StatusBuilder.fail(error instanceof Error ? error.message : "gg"),
        500,
      );
    }
  }
}
