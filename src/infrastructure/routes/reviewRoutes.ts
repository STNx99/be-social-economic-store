import { Hono } from "hono";
import { Container } from "@/infrastructure/dependencies/Container";
import { requireAuth } from "@/infrastructure/middleware/auth";

export class ReviewRoutes {
  private app: Hono;
  private container: Container;

  constructor(app: Hono) {
    this.app = app;
    this.container = Container.getInstance();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    const reviewController = this.container.getReviewController();

    // Product-specific review routes
    this.app.get("/api/products/:productId/reviews", (c) => reviewController.listReviews(c));
    this.app.get("/api/products/:productId/reviews/summary", (c) => reviewController.getSummary(c));
    this.app.post("/api/products/:productId/reviews", requireAuth(), (c) =>
      reviewController.createReview(c),
    );

    // General review routes
    this.app.get("/api/reviews", (c) => reviewController.listReviews(c));
    this.app.get("/api/reviews/:id", (c) => reviewController.getReview(c));

    this.app.put("/api/reviews/:id", requireAuth(), (c) =>
      reviewController.updateReview(c),
    );
    this.app.delete("/api/reviews/:id", requireAuth(), (c) =>
      reviewController.deleteReview(c),
    );
  }
}