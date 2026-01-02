import { Hono } from "hono";
import { Container } from "@/infrastructure/dependencies/Container";
import { requireAuth, requireAdmin } from "@/infrastructure/middleware/auth";

export function setupProductRoutes(app: Hono) {
  app.use("/api/products", requireAuth());
  app.use("/api/products/*", requireAuth());

  const container = Container.getInstance();
  const productController = container.getProductController();

  app.post("/api/products/upload-url", (c) =>
    productController.generatePresignedUrl(c),
  );
  app.post("/api/products/delete-image", (c) =>
    productController.deleteImage(c),
  );
  app.patch("/api/products/:id/approve", requireAdmin(), (c) =>
    productController.approveProduct(c),
  );
  app.post("/api/products", (c) => productController.createProduct(c));
  app.get("/api/products/user", (c) => productController.listUserProducts(c));
  app.get("/api/products", (c) => productController.listProducts(c));
  app.get("/api/products/:id", (c) => productController.getProduct(c));
  app.put("/api/products/:id", (c) => productController.updateProduct(c));
  app.delete("/api/products/:id", (c) => productController.deleteProduct(c));
}