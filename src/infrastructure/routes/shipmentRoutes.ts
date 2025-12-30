import { Hono } from "hono";
import { Container } from "@/infrastructure/dependencies/Container";
import { requireAuth } from "@/infrastructure/middleware/auth";

export const setupShipmentRoutes = (app: Hono) => {
  app.use("/api/shipments", requireAuth());
  app.use("/api/shipments/*", requireAuth());

  const container = Container.getInstance();
  const shipmentController = container.getShipmentController();

  app.post("/api/shipments", (c) => shipmentController.createShipment(c));
  app.get("/api/shipments", (c) => shipmentController.listAllShipments(c));
  app.get("/api/shipments/:id", (c) => shipmentController.getShipment(c));
  app.get("/api/shipments/order/:orderId", (c) => shipmentController.getShipmentsByOrder(c));
  app.patch("/api/shipments/:id", (c) => shipmentController.updateShipment(c));
  app.patch("/api/shipments/:id/status", (c) => shipmentController.updateShipmentStatus(c));
};