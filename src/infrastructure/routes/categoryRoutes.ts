import { Hono } from "hono";
import { Container } from "@/infrastructure/dependencies/Container";
import { requireAuth, requireAdmin } from "@/infrastructure/middleware/auth";

export function setupCategoryRoutes(app: Hono) {
  app.use("/api/categories", requireAuth());
  app.use("/api/categories/*", requireAuth());

  try {
    const container = Container.getInstance();
    const categoryController = container.getCategoryController();

    app.post("/api/categories", requireAdmin(), (c) =>
      categoryController.createCategory(c),
    );
    app.get("/api/categories", (c) => categoryController.listCategories(c));
    app.get("/api/categories/:id", (c) => categoryController.getCategory(c));
    app.put("/api/categories/:id", requireAdmin(), (c) =>
      categoryController.updateCategory(c),
    );
    app.delete("/api/categories/:id", requireAdmin(), (c) =>
      categoryController.deleteCategory(c),
    );
  } catch (error) {
    console.error("[CategoryRoutes] Failed to setup routes:", error);

    app.post("/api/categories", (c) =>
      c.json({ success: false, error: "Category service unavailable" }, 500),
    );
    app.get("/api/categories", (c) =>
      c.json({ success: false, error: "Category service unavailable" }, 500),
    );
    app.get("/api/categories/:id", (c) =>
      c.json({ success: false, error: "Category service unavailable" }, 500),
    );
    app.put("/api/categories/:id", (c) =>
      c.json({ success: false, error: "Category service unavailable" }, 500),
    );
    app.delete("/api/categories/:id", (c) =>
      c.json({ success: false, error: "Category service unavailable" }, 500),
    );
  }
}