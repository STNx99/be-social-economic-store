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

    // Placeholder routes - sẽ implement sau
    this.app.get("/api/inventory", (c) => {
      return c.json({ success: true, message: "Inventory endpoint" }, 200);
    });

    this.app.get("/api/inventory/:id", (c) => {
      const id = c.req.param("id");
      return c.json({ success: true, message: `Get inventory ${id}` }, 200);
    });

    this.app.post("/api/inventory", (c) => {
      return c.json({ success: true, message: "Create inventory" }, 201);
    });

    this.app.put("/api/inventory/:id", (c) => {
      const id = c.req.param("id");
      return c.json({ success: true, message: `Update inventory ${id}` }, 200);
    });

    this.app.delete("/api/inventory/:id", (c) => {
      const id = c.req.param("id");
      return c.json({ success: true, message: `Delete inventory ${id}` }, 200);
    });
  }
}

