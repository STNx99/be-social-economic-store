import { Context } from "hono";
import { IReviewUseCase } from "@/domain/usecases/IReviewUseCase";
import { StatusBuilder } from "@/utils";
import { CreateReviewInput, UpdateReviewInput } from "@/utils/schemas/review";

export class ReviewController {
  constructor(private reviewUseCase: IReviewUseCase) {}

  async createReview(c: Context) {
    try {
      const userId = c.get("userId") as string;
      if (!userId) {
        return c.json(StatusBuilder.fail("Unauthorized: User ID not found"), 401);
      }

      const productId = c.req.param("productId");
      if (!productId) {
        return c.json(StatusBuilder.fail("Product ID is required"), 400);
      }

      const body = (await c.req.json()) as CreateReviewInput;
      const review = await this.reviewUseCase.createReview(productId, userId, body);

      return c.json(
        {
          success: true,
          data: review,
          message: "Review created successfully",
        },
        201,
      );
    } catch (error: unknown) {
      console.error("[ReviewController.createReview]:", error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }

  async getReview(c: Context) {
    try {
      const id = c.req.param("id");
      const review = await this.reviewUseCase.getReviewById(id);

      if (review) {
        return c.json(
          {
            success: true,
            data: review,
          },
          200,
        );
      } else {
        return c.json(StatusBuilder.fail("Review not found"), 404);
      }
    } catch (error: unknown) {
      console.error("[ReviewController.getReview]:", error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }

  async listReviews(c: Context) {
    try {
      const productId = c.req.query("productId") || c.req.param("productId");
      const userId = c.req.query("userId");

      let reviews;
      if (productId) {
        reviews = await this.reviewUseCase.getReviewsByProductId(productId);
      } else if (userId) {
        reviews = await this.reviewUseCase.getReviewsByUserId(userId);
      } else {
        reviews = await this.reviewUseCase.getAllReviews();
      }

      return c.json(
        {
          success: true,
          data: reviews,
        },
        200,
      );
    } catch (error: unknown) {
      console.error("[ReviewController.listReviews]:", error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }

  async updateReview(c: Context) {
    try {
      const userId = c.get("userId") as string;
      if (!userId) {
        return c.json(StatusBuilder.fail("Unauthorized: User ID not found"), 401);
      }

      const id = c.req.param("id");
      const body = (await c.req.json()) as UpdateReviewInput;
      const review = await this.reviewUseCase.updateReview(id, userId, body);

      return c.json(
        {
          success: true,
          data: review,
          message: "Review updated successfully",
        },
        200,
      );
    } catch (error: unknown) {
      console.error("[ReviewController.updateReview]:", error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }

  async deleteReview(c: Context) {
    try {
      const userId = c.get("userId") as string;
      if (!userId) {
        return c.json(StatusBuilder.fail("Unauthorized: User ID not found"), 401);
      }

      const id = c.req.param("id");
      await this.reviewUseCase.deleteReview(id, userId);

      return c.json(
        {
          success: true,
          message: "Review deleted successfully",
        },
        200,
      );
    } catch (error: unknown) {
      console.error("[ReviewController.deleteReview]:", error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }

  async getSummary(c: Context) {
    try {
      const productId = c.req.param("productId");
      if (!productId) {
        return c.json(StatusBuilder.fail("Product ID is required"), 400);
      }

      const summary = await this.reviewUseCase.getReviewSummary(productId);
      return c.json(
        {
          success: true,
          data: summary,
        },
        200,
      );
    } catch (error: unknown) {
      console.error("[ReviewController.getSummary]:", error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }
}