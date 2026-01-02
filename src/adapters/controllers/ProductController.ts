import { Context } from "hono";
import {
  CreateProductRequest,
  CreateProductRequestSchema,
  UpdateProductRequest,
  UpdateProductRequestSchema,
  DeleteProductRequest,
  ListProductsRequest,
  ListProductsRequestSchema,
  GeneratePresignedUrlRequest,
  ProductStatus,
} from "@/utils/schemas/endpoints/products";
import { IProductUseCase } from "@/domain/usecases/IProductUseCase";
import { StatusBuilder } from "@/utils";

export class ProductController {
  constructor(private productUseCase: IProductUseCase) {}

  async createProduct(c: Context) {
    try {
      const userId = c.get("userId") as string;
      if (!userId) {
        return c.json(StatusBuilder.fail("Unauthorized: User ID not found"), 401);
      }

      const json = await c.req.json();
      console.log("[ProductController] Incoming JSON:", JSON.stringify(json, null, 2));
      const body = CreateProductRequestSchema.parse(json);
      const response = await this.productUseCase.createProduct(body, userId);
      console.log(response)

      if (response.success) {
        return c.json(response, 201);
      } else {
        return c.json(response, 400);
      }
    } catch (error: unknown) {
      console.error("[ProductController] Error in createProduct:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return c.json(
          StatusBuilder.fail("Validation failed", (error as any).issues.map((i: any) => ({
            field: i.path.join("."),
            message: i.message
          }))),
          400
        );
      }
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }

  async getProduct(c: Context) {
    try {
      const userId = c.get("userId") as string | undefined;
      const role = c.get("role") as string | undefined;
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
    } catch (error: unknown) {
      console.error(error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }

  async updateProduct(c: Context) {
    try {
      const userId = c.get("userId") as string;
      if (!userId) {
        return c.json(StatusBuilder.fail("Unauthorized: User ID not found"), 401);
      }

      const id = c.req.param("id");
      const json = await c.req.json();
      const body = UpdateProductRequestSchema.parse(json);
      const response = await this.productUseCase.updateProduct(id, body, userId);

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "ZodError") {
        return c.json(
          StatusBuilder.fail("Validation failed", (error as any).issues.map((i: any) => ({
            field: i.path.join("."),
            message: i.message
          }))),
          400
        );
      }
      console.error(error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }

  async deleteProduct(c: Context) {
    try {
      const userId = c.get("userId") as string;
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
    } catch (error: unknown) {
      console.error(error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }

  async listProducts(c: Context) {
    try {
      const userId = c.get("userId") as string | undefined;
      const role = c.get("role") as string | undefined;
      const query = c.req.query();
      const request = ListProductsRequestSchema.parse(query);

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
    } catch (error: unknown) {
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }

  async listUserProducts(c: Context) {
    try {
      const userId = c.get("userId") as string;
      if (!userId) {
        return c.json(StatusBuilder.fail("Unauthorized: User ID not found"), 401);
      }

      const query = c.req.query();
      const request = ListProductsRequestSchema.parse(query);

      const response = await this.productUseCase.listUserProducts(
        request,
        userId,
      );

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error: unknown) {
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }

  async generatePresignedUrl(c: Context) {
    try {
      const body = (await c.req.json()) as GeneratePresignedUrlRequest;
      const response = await this.productUseCase.generatePresignedUrl(body);

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error: unknown) {
      console.error(error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }

  async deleteImage(c: Context) {
    try {
      const body = (await c.req.json()) as { key: string };
      const response = await this.productUseCase.deleteImage(body.key);

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error: unknown) {
      console.error(error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
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
    } catch (error: unknown) {
      console.error(error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }
}