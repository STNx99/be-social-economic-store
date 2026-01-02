import { Hono } from "hono";
import { Container } from "@/infrastructure/dependencies/Container";
import { requireAuth } from "@/infrastructure/middleware/auth";

export function setupReviewRoutes(app: Hono) {
  const container = Container.getInstance();
  const reviewController = container.getReviewController();

  app.get("/api/products/:productId/reviews", (c) =>
    reviewController.listReviews(c),
  );
  app.get("/api/products/:productId/reviews/summary", (c) =>
    reviewController.getSummary(c),
  );
  app.post("/api/products/:productId/reviews", requireAuth(), (c) =>
    reviewController.createReview(c),
  );

  app.get("/api/reviews", (c) => reviewController.listReviews(c));
  app.get("/api/reviews/:id", (c) => reviewController.getReview(c));

  app.put("/api/reviews/:id", requireAuth(), (c) =>
    reviewController.updateReview(c),
  );
  app.delete("/api/reviews/:id", requireAuth(), (c) =>
    reviewController.deleteReview(c),
  );
}