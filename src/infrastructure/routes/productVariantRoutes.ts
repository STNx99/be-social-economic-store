import { Hono } from "hono";
import { Container } from "@/infrastructure/dependencies/Container";
import { requireAuth } from "@/infrastructure/middleware/auth";

export function setupProductVariantRoutes(app: Hono) {
  const container = Container.getInstance();
  const controller = container.getProductVariantController();

  app.get("/api/products/variants", (c) => controller.listVariantsByProduct(c));
  app.get("/api/products/variants/:id", (c) => controller.getVariant(c));

  app.post("/api/products/variants", requireAuth(), (c) => controller.createVariant(c));
  app.put("/api/products/variants/:id", requireAuth(), (c) => controller.updateVariant(c));
  app.delete("/api/products/variants/:id", requireAuth(), (c) => controller.deleteVariant(c));
}