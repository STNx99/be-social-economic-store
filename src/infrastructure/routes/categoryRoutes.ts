import { Hono } from "hono";
import { Container } from "@/infrastructure/dependencies/Container";
import { requireAuth } from "@/infrastructure/middleware/auth";

export function setupCategoryRoutes(app: Hono) {
  app.use("/api/categories", requireAuth());
  app.use("/api/categories/*", requireAuth());

  try {
    const container = Container.getInstance();
    const categoryController = container.getCategoryController();

    app.post("/api/categories", (c) => categoryController.createCategory(c));
    app.get("/api/categories", (c) => categoryController.listCategories(c));
    app.get("/api/categories/:id", (c) => categoryController.getCategory(c));
    app.put("/api/categories/:id", (c) => categoryController.updateCategory(c));
    app.delete("/api/categories/:id", (c) => categoryController.deleteCategory(c));
  } catch (error) {
    console.error("[CategoryRoutes] Failed to setup routes:", error);

// fallback
    app.post("/api/categories", (c) =>
      c.json({ success: false, error: "dịch vụ theo danh mục không có sẵn" }, 500),
    );
    app.get("/api/categories", (c) =>
      c.json({ success: false, error: "dịch vụ theo danh mục không có sẵn" }, 500),
    );
    app.get("/api/categories/:id", (c) =>
      c.json({ success: false, error: "dịch vụ theo danh mục không có sẵn" }, 500),
    );
    app.put("/api/categories/:id", (c) =>
      c.json({ success: false, error: "dịch vụ theo danh mục không có sẵn" }, 500),
    );
    app.delete("/api/categories/:id", (c) =>
      c.json({ success: false, error: "dịch vụ theo danh mục không có sẵn" }, 500),
    );
  }
}

