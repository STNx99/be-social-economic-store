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
    this.app.use("/api/inventory", requireAuth());
    this.app.use("/api/inventory/*", requireAuth());

    const inventoryController = this.container.getInventoryController();

    this.app.get("/api/inventory", (c) => inventoryController.listInventories(c));
    this.app.get("/api/inventory/:id", (c) => inventoryController.getInventory(c));
    this.app.post("/api/inventory", (c) => inventoryController.createInventory(c));
    this.app.put("/api/inventory/:id", (c) => inventoryController.updateInventory(c));
    this.app.delete("/api/inventory/:id", (c) => inventoryController.deleteInventory(c));
  }
}

