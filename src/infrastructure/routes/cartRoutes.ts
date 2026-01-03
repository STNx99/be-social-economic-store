import { Hono } from "hono";
import { Container } from "../dependencies/Container";
import { requireAuth } from "../middleware/auth";

export const setupCartRoutes = (app: Hono) => {
  app.use("/api/cart", requireAuth());
  app.use("/api/cart/*", requireAuth());

  const container = Container.getInstance();
  const cartController = container.getCartController();

  app.get("/api/cart", (c) => cartController.getCart(c));
  app.post("/api/cart", (c) => cartController.addToCart(c));
  app.post("/api/cart/add", (c) => cartController.addToCart(c));
  app.put("/api/cart/update", (c) => cartController.updateCartItem(c));
  app.delete("/api/cart/remove", (c) => cartController.removeFromCart(c));
  app.delete("/api/cart/clear", (c) => cartController.clearCart(c));
};