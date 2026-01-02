import { Hono } from "hono";
import { Container } from "@/infrastructure/dependencies/Container";
import { requireAuth } from "@/infrastructure/middleware/auth";

export function setupInventoryRoutes(app: Hono) {
  app.use("/api/inventory", requireAuth());
  app.use("/api/inventory/*", requireAuth());

  const inventoryController = Container.getInstance().getInventoryController();

  app.get("/api/inventory", (c) => inventoryController.listInventory(c));
  app.get("/api/inventory/slow-moving", (c) =>
    inventoryController.getSlowMovingItems(c),
  );
  app.get("/api/inventory/variants/:variantId", (c) =>
    inventoryController.getInventoryByVariantId(c),
  );
  app.get("/api/inventory/products/:productId", (c) =>
    inventoryController.getInventoryByProductId(c),
  );
  app.post("/api/inventory/variants/:variantId/adjust", (c) =>
    inventoryController.adjustInventory(c),
  );
  app.get("/api/inventory/variants/:variantId/movements", (c) =>
    inventoryController.getMovementHistory(c),
  );
}