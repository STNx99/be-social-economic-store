import { Hono } from "hono";
import { Container } from "@/infrastructure/dependencies/Container";

export function setupProductRoutes(app: Hono) {
  const container = Container.getInstance();
  const productController = container.getProductController();

  // Generate presigned URL for image upload
  app.post("/api/products/upload-url", (c) =>
    productController.generatePresignedUrl(c),
  );

  // CRUD operations
  app.post("/api/products", (c) => productController.createProduct(c));
  app.get("/api/products", (c) => productController.listProducts(c));
  app.get("/api/products/:id", (c) => productController.getProduct(c));
  app.put("/api/products/:id", (c) => productController.updateProduct(c));
  app.delete("/api/products/:id", (c) => productController.deleteProduct(c));
}






