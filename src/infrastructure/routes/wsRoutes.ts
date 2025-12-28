import { WsController } from "@/adapters/controllers/WsController";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import { Container } from "../dependencies/Container";
import { requireAuth } from "@/infrastructure/middleware/auth";

export function setUpWebsocketRoute(app: Hono) {
  const container = Container.getInstance();
  const wsUseCase = container.getWsUseCase();
  const wsController = new WsController(wsUseCase);

  app.use("/ws", requireAuth());

  app.get(
    "/ws",
    upgradeWebSocket((c) => {
      const userId = c.get("userId") as string;
      let clientId: string;

      return {
        onOpen: (_event, ws) => {
          clientId = wsController.handleConnection(ws, userId);
        },
        onMessage: (event) => {
          if (clientId) {
            wsController.handleMessage(clientId, event);
          }
        },
        onClose: (event) => {
          if (clientId) {
            wsController.handleDisconnection(clientId, event);
          }
        },
        onError: (event) => {
          if (clientId) {
            wsController.handleError(clientId, event);
          }
        },
      };
    })
  );
}