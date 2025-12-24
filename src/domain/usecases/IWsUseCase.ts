export interface IWsUseCase {
  addClient(ws: WebSocket, userId: string): string;
  removeClient(clientId: string): void;
  getUserIdByClientId(clientId: string): string | null;
  sendToUser(userId: string, payload: unknown): void;
  sendToClient(clientId: string, payload: unknown): void;
  getClientIdsForUser(userId: string): string[];
}