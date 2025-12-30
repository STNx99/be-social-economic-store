import { Hono } from "hono";
import { Container } from "@/infrastructure/dependencies/Container";
import { requireAuth } from "@/infrastructure/middleware/auth";

export const setupPaymentRoutes = (app: Hono) => {
  app.use("/api/payments", requireAuth());
  app.use("/api/payments/*", requireAuth());

  const container = Container.getInstance();
  const paymentController = container.getPaymentController();

  app.post("/api/payments", (c) => paymentController.createPayment(c));
  app.get("/api/payments", (c) => paymentController.listAllPayments(c));
  app.get("/api/payments/:id", (c) => paymentController.getPayment(c));
  app.get("/api/payments/order/:orderId", (c) => paymentController.getPaymentsByOrder(c));
  app.patch("/api/payments/:id", (c) => paymentController.updatePayment(c));
  app.post("/api/payments/:id/process", (c) => paymentController.processPayment(c));
};