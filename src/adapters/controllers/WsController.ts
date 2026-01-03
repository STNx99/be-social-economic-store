import { IWsUseCase } from "@/domain/usecases/IWsUseCase";
import { WSContext, WSMessageReceive } from "hono/ws";
import { ChatClientMessageSchema } from "@/utils/schemas/endpoints/ws";
import { MessageFactory } from "@/application/factories/message/MessageFactory";

export class WsController {
  constructor(private wsUseCase: IWsUseCase) {}

  handleConnection(ws: WSContext, userId: string): string {
    console.log("Handling new connection", userId)
    return this.wsUseCase.addClient(ws, userId);
  }

  handleMessage(clientId: string, event: MessageEvent<WSMessageReceive>) {
    const userId = this.wsUseCase.getUserIdByClientId(clientId);
    console.log("Handling message", userId)
    if (!userId) return;

    try {
      const data = event.data;
      let payload: unknown;

      if (typeof data === "string") {
        payload = MessageFactory.parse(data);
        if (payload === null) return;
      } else {
        payload = data;
      }

      const result = ChatClientMessageSchema.safeParse(payload);
      if (!result.success) return;

      const message = result.data;

      if (message.userId !== userId) {
        return;
      }

      if (message.type === "direct") {
        this.wsUseCase.handleDirectMessage(userId, message);
      }
    } catch (error) {
      console.error(`[WsController] Unexpected error processing message from ${clientId}:`, error);
    }
  }

  handleDisconnection(clientId: string, event: CloseEvent) {
    this.wsUseCase.removeClient(clientId);
  }

  handleError(clientId: string, event: Event) {
    console.error(`[WsController] WebSocket error on client ${clientId}:`, event);
    this.wsUseCase.removeClient(clientId);
  }
}