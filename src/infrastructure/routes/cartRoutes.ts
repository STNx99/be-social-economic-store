import { Hono } from "hono";
import { Container } from "@/infrastructure/dependencies/Container";
import { requireAuth } from "@/infrastructure/middleware/auth";

export function setupCartRoutes(app: Hono) {
  app.use("/api/cart", requireAuth());
  app.use("/api/cart/*", requireAuth());

  try {
    const container = Container.getInstance();
    const cartController = container.getCartController();

    app.post("/api/cart/add", (c) => cartController.addToCart(c));
    app.get("/api/cart", (c) => cartController.getCart(c));
    app.put("/api/cart/update", (c) => cartController.updateCartItem(c));
    app.delete("/api/cart/remove", (c) => cartController.removeFromCart(c));
    app.delete("/api/cart/clear", (c) => cartController.clearCart(c));
  } catch (error) {
    console.error("[CartRoutes] Failed to setup routes:", error);

    app.post("/api/cart/add", (c) =>
      c.json({ success: false, error: "Cart service unavailable" }, 500),
    );
    app.get("/api/cart", (c) =>
      c.json({ success: false, error: "Cart service unavailable" }, 500),
    );
    app.put("/api/cart/update", (c) =>
      c.json({ success: false, error: "Cart service unavailable" }, 500),
    );
    app.delete("/api/cart/remove", (c) =>
      c.json({ success: false, error: "Cart service unavailable" }, 500),
    );
    app.delete("/api/cart/clear", (c) =>
      c.json({ success: false, error: "Cart service unavailable" }, 500),
    );
  }
}

