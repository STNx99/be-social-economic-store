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
    this.app.use("/api/reviews", requireAuth());
    this.app.use("/api/reviews/*", requireAuth());

    // Placeholder routes - sẽ implement sau
    this.app.get("/api/reviews", (c) => {
      return c.json({ success: true, message: "List reviews" }, 200);
    });

    this.app.get("/api/reviews/:id", (c) => {
      const id = c.req.param("id");
      return c.json({ success: true, message: `Get review ${id}` }, 200);
    });

    this.app.post("/api/reviews", (c) => {
      return c.json({ success: true, message: "Create review" }, 201);
    });

    this.app.put("/api/reviews/:id", (c) => {
      const id = c.req.param("id");
      return c.json({ success: true, message: `Update review ${id}` }, 200);
    });

    this.app.delete("/api/reviews/:id", (c) => {
      const id = c.req.param("id");
      return c.json({ success: true, message: `Delete review ${id}` }, 200);
    });
  }
}

