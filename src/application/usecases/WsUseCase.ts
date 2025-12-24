import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { IWsUseCase } from "@/domain/usecases/IWsUseCase";

export class WsUseCase implements IWsUseCase {
  private clients = new Map<
    string,
    { ws: WebSocket; userId: string; createdAt: Date }
  >();
  private userClients = new Map<string, Set<string>>();

  constructor(private userRepository: IUserRepository) {}

  addClient(ws: WebSocket, userId: string): string {
    const id = crypto.randomUUID();
    this.clients.set(id, { ws, userId, createdAt: new Date() });
    let set = this.userClients.get(userId);
    if (!set) {
      set = new Set();
      this.userClients.set(userId, set);
    }
    set.add(id);
    return id;
  }

  removeClient(clientId: string): void {
    const meta = this.clients.get(clientId);
    if (!meta) return;
    const { userId } = meta;
    const set = this.userClients.get(userId);
    if (set) {
      set.delete(clientId);
      if (set.size === 0) {
        this.userClients.delete(userId);
      }
    }
    this.clients.delete(clientId);
  }

  getUserIdByClientId(clientId: string): string | null {
    const meta = this.clients.get(clientId);
    return meta ? meta.userId : null;
  }

  getClientIdsForUser(userId: string): string[] {
    const set = this.userClients.get(userId);
    if (!set) return [];
    return Array.from(set);
  }

  private getWsForClient(clientId: string): WebSocket | undefined {
    const meta = this.clients.get(clientId);
    return meta?.ws;
  }

  sendToClient(clientId: string, payload: unknown): void {
    const ws = this.getWsForClient(clientId);
    if (!ws) return;
    try {
      ws.send(typeof payload === "string" ? payload : JSON.stringify(payload));
    } catch (e) {
      console.error("[WsUseCase] Failed to send to client", clientId, e);
    }
  }

  sendToUser(userId: string, payload: unknown): void {
    const clientIds = this.getClientIdsForUser(userId);
    for (const id of clientIds) this.sendToClient(id, payload);
  }
}