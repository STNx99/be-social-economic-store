import { ChatClientMessage } from "@/utils/schemas/endpoints/ws";
import { WSContext } from "hono/ws";

export interface IWsUseCase {
  addClient(ws: WSContext, userId: string): string;
  removeClient(clientId: string): void;
  getUserIdByClientId(clientId: string): string | null;
  sendToUser(userId: string, payload: unknown): void;
  sendToClient(clientId: string, payload: unknown): void;
  getClientIdsForUser(userId: string): string[];
  handleDirectMessage(senderUserId: string, message: ChatClientMessage): void;
}