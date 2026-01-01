import { Context } from "hono";
import { IProductVariantUseCase } from "@/domain/usecases/IProductVariantUseCase";
import {
  CreateProductVariantRequest,
  UpdateProductVariantRequest,
} from "@/utils/schemas/endpoints/productVariants";
import { StatusBuilder } from "@/utils";

export class ProductVariantController {
  constructor(private variantUseCase: IProductVariantUseCase) {}

  async createVariant(c: Context) {
    try {
      const userId = c.get("userId") as string;
      if (!userId) {
        return c.json(StatusBuilder.fail("Unauthorized: User ID not found"), 401);
      }

      const body = (await c.req.json()) as CreateProductVariantRequest;
      const response = await this.variantUseCase.createVariant(body, userId);

      if (response.success) {
        return c.json(response, 201);
      } else {
        return c.json(response, 400);
      }
    } catch (error: unknown) {
      console.error("[ProductVariantController] Error creating variant:", error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }

  async getVariant(c: Context) {
    try {
      const id = c.req.param("id");
      const response = await this.variantUseCase.getVariant({ id });

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 404);
      }
    } catch (error: unknown) {
      console.error("[ProductVariantController] Error getting variant:", error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }

  async updateVariant(c: Context) {
    try {
      const userId = c.get("userId") as string;
      if (!userId) {
        return c.json(StatusBuilder.fail("Unauthorized: User ID not found"), 401);
      }

      const id = c.req.param("id");
      const body = (await c.req.json()) as UpdateProductVariantRequest;
      const response = await this.variantUseCase.updateVariant(id, body, userId);

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error: unknown) {
      console.error("[ProductVariantController] Error updating variant:", error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }

  async deleteVariant(c: Context) {
    try {
      const userId = c.get("userId") as string;
      if (!userId) {
        return c.json(StatusBuilder.fail("Unauthorized: User ID not found"), 401);
      }

      const id = c.req.param("id");
      const response = await this.variantUseCase.deleteVariant({ id }, userId);

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 404);
      }
    } catch (error: unknown) {
      console.error("[ProductVariantController] Error deleting variant:", error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }

  async listVariantsByProduct(c: Context) {
    try {
      const productId = c.req.query("productId");
      if (!productId) {
        return c.json(StatusBuilder.fail("Product ID is required"), 400);
      }

      const response = await this.variantUseCase.listVariantsByProduct({ productId });

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error: unknown) {
      console.error("[ProductVariantController] Error listing variants:", error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }
}