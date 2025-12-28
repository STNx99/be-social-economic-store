import type { WSContext } from "hono/ws";

export interface IWsRepository {
  addClient(ws: WSContext, userId: string): string;
  removeClient(clientId: string): void;
  getUserIdByClientId(clientId: string): string | null;
  getClientIdsForUser(userId: string): string[];
  getWsForClient(clientId: string): WSContext | undefined;
  sendToClient(clientId: string, payload: string): void;
  sendToUser(userId: string, payload: string): void;
}