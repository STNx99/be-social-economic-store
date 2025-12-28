import { IWsRepository } from "@/domain/repositories/IWsRepository";
import { IWsUseCase } from "@/domain/usecases/IWsUseCase";
import { MessageFactory } from "@/application/factories/message/MessageFactory";
import { ChatClientMessage } from "@/utils/schemas/endpoints/ws";
import { WSContext } from "hono/ws";

export class WsUseCase implements IWsUseCase {
  constructor(private wsRepository: IWsRepository) {}

  addClient(ws: WSContext, userId: string): string {
    return this.wsRepository.addClient(ws, userId);
  }

  removeClient(clientId: string): void {
    this.wsRepository.removeClient(clientId);
  }

  getUserIdByClientId(clientId: string): string | null {
    return this.wsRepository.getUserIdByClientId(clientId);
  }

  getClientIdsForUser(userId: string): string[] {
    return this.wsRepository.getClientIdsForUser(userId);
  }

  sendToClient(clientId: string, payload: unknown): void {
    const message = MessageFactory.serialize(payload);
    this.wsRepository.sendToClient(clientId, message);
  }

  sendToUser(userId: string, payload: unknown): void {
    const message = MessageFactory.serialize(payload);
    this.wsRepository.sendToUser(userId, message);
  }

  handleDirectMessage(senderUserId: string, message: ChatClientMessage): void {
    const serverMessage = MessageFactory.createServer("direct", {
      fromUserId: senderUserId,
      content: message.content,
      timestamp: new Date().toISOString(),
    });

    this.sendToUser(message.toUserId, serverMessage);
  }
}