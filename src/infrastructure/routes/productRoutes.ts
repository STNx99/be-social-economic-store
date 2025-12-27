import { Hono } from "hono";
import { Container } from "@/infrastructure/dependencies/Container";

export function setupProductRoutes(app: Hono) {
  try {
    const container = Container.getInstance();
    const productController = container.getProductController();

    app.post("/api/products/upload-url", (c) =>
      productController.generatePresignedUrl(c),
    );
    app.post("/api/products", (c) => productController.createProduct(c));
    app.get("/api/products", (c) => productController.listProducts(c));
    app.get("/api/products/:id", (c) => productController.getProduct(c));
    app.put("/api/products/:id", (c) => productController.updateProduct(c));
    app.delete("/api/products/:id", (c) => productController.deleteProduct(c));
  } catch (error) {
    console.error("[ProductRoutes] Failed to setup routes:", error);
    // Vẫn đăng ký routes nhưng sẽ trả về lỗi khi gọi
    app.post("/api/products/upload-url", (c) =>
      c.json({ success: false, error: "S3 service not configured" }, 500),
    );
    app.post("/api/products", (c) =>
      c.json({ success: false, error: "Product service not available" }, 500),
    );
    app.get("/api/products", (c) =>
      c.json({ success: false, error: "Product service not available" }, 500),
    );
    app.get("/api/products/:id", (c) =>
      c.json({ success: false, error: "Product service not available" }, 500),
    );
    app.put("/api/products/:id", (c) =>
      c.json({ success: false, error: "Product service not available" }, 500),
    );
    app.delete("/api/products/:id", (c) =>
      c.json({ success: false, error: "Product service not available" }, 500),
    );
  }
}






