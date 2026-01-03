import { Hono } from "hono";
import { Container } from "@/infrastructure/dependencies/Container";
import { requireAuth } from "@/infrastructure/middleware/auth";

export function setupOrderRoutes(app: Hono) {
  app.use("/api/orders", requireAuth());
  app.use("/api/orders/*", requireAuth());

  const container = Container.getInstance();
  const orderController = container.getOrderController();

  app.post("/api/orders", (c) => orderController.createOrder(c));
  app.post("/api/orders/checkout", (c) => orderController.checkout(c));
  app.get("/api/orders/my-orders", (c) => orderController.listCustomerOrders(c));

  app.get("/api/orders/seller-orders", (c) => orderController.listSellerOrders(c));
  app.patch("/api/orders/:id/status", (c) => orderController.updateOrderStatus(c));

  app.get("/api/orders/:id", (c) => orderController.getOrder(c));
  app.post("/api/orders/:id/cancel", (c) => orderController.cancelOrder(c));
}