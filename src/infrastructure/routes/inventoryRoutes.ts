import { Hono } from "hono";
import { Container } from "@/infrastructure/dependencies/Container";
import { requireAuth } from "@/infrastructure/middleware/auth";

export class InventoryRoutes {
  private app: Hono;
  private container: Container;

  constructor(app: Hono) {
    this.app = app;
    this.container = Container.getInstance();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    const inventoryController = this.container.getInventoryController();

    this.app.use("/api/inventory", requireAuth());
    this.app.use("/api/inventory/*", requireAuth());
    this.app.get("/api/inventory", (c) => inventoryController.listInventory(c));
    this.app.get("/api/inventory/slow-moving", (c) =>
      inventoryController.getSlowMovingItems(c),
    );
    this.app.get("/api/inventory/variants/:variantId", (c) =>
      inventoryController.getInventoryByVariantId(c),
    );
    this.app.get("/api/inventory/products/:productId", (c) =>
      inventoryController.getInventoryByProductId(c),
    );
    this.app.post("/api/inventory/variants/:variantId/adjust", (c) =>
      inventoryController.adjustInventory(c),
    );
    this.app.get("/api/inventory/variants/:variantId/movements", (c) =>
      inventoryController.getMovementHistory(c),
    );
  }
}