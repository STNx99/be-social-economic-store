import { Hono } from "hono";
import { Container } from "@/infrastructure/dependencies/Container";
import { requireAuth } from "@/infrastructure/middleware/auth";

export function setupReportRoutes(app: Hono) {
  app.use("/api/report/*", requireAuth());

  const container = Container.getInstance();
  const orderController = container.getOrderController();

  app.get("/api/report/sales", (c) => orderController.getSalesReport(c));
}