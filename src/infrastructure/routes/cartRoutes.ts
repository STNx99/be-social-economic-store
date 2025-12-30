import { Hono } from "hono";
import { Container } from "../dependencies/Container";
import { authMiddleware } from "../middleware/auth";

export const setupCartRoutes = (app: Hono) => {
  const container = Container.getInstance();
  const cartController = container.getCartController();

  const cartRoutes = new Hono();

  cartRoutes.use("/*", authMiddleware);

  cartRoutes.get("/", (c) => cartController.getCart(c));
  cartRoutes.post("/add", (c) => cartController.addToCart(c));
  cartRoutes.put("/update", (c) => cartController.updateCartItem(c));
  cartRoutes.delete("/remove", (c) => cartController.removeFromCart(c));
  cartRoutes.delete("/clear", (c) => cartController.clearCart(c));

  app.route("/api/cart", cartRoutes);
};
