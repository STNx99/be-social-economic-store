import { Hono } from "hono";
import { Container } from "@/infrastructure/dependencies/Container";
import { requireAuth } from "@/infrastructure/middleware/auth";

export class ProductVariantRoutes {
  private app: Hono;
  private container: Container;

  constructor(app: Hono) {
    this.app = app;
    this.container = Container.getInstance();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    const controller = this.container.getProductVariantController();

    this.app.get("/api/products/variants", (c) =>
      controller.listVariantsByProduct(c),
    );
    this.app.get("/api/products/variants/:id", (c) => controller.getVariant(c));

    this.app.post("/api/products/variants", requireAuth(), (c) =>
      controller.createVariant(c),
    );
    this.app.put("/api/products/variants/:id", requireAuth(), (c) =>
      controller.updateVariant(c),
    );
    this.app.delete("/api/products/variants/:id", requireAuth(), (c) =>
      controller.deleteVariant(c),
    );
  }
}
