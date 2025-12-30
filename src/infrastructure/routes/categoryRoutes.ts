import { Hono } from "hono";
import { Container } from "@/infrastructure/dependencies/Container";
import { requireAuth, requireAdmin } from "@/infrastructure/middleware/auth";

export function setupCategoryRoutes(app: Hono) {
  app.use("/api/categories", requireAuth());
  app.use("/api/categories/*", requireAuth());

  const container = Container.getInstance();
  const categoryController = container.getCategoryController();

  app.post("/api/categories", requireAdmin(), (c) => categoryController.createCategory(c));
  app.get("/api/categories", (c) => categoryController.listCategories(c));
  app.get("/api/categories/:id", (c) => categoryController.getCategory(c));
  app.put("/api/categories/:id", requireAdmin(), (c) => categoryController.updateCategory(c));
  app.delete("/api/categories/:id", requireAdmin(), (c) =>
    categoryController.deleteCategory(c),
  );
}