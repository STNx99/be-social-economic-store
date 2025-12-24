import { WsController } from "@/adapters/controllers/WsController";
import { UserRepository } from "@/adapters/repositories/UserRepository";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import { Container } from "../dependencies/Container";

export function setUpWebsocketRoute(app: Hono) {
  const container = Container.getInstance();
  const userRepository = container.getUserRepository();
  const wsUseCase = container.getWsUseCase();
  const wsController = new WsController(wsUseCase)
  app.get(
    "/ws",
    upgradeWebSocket((c) => {
      return {
        async onOpen(_ev, ws) {},
        onMessage(ev, ws) {},
        onClose() {},
        onError(err) {},
      };
    }),
  );
}
