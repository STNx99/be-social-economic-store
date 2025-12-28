import { WSClient } from "@/domain/entities/wsentities/Client";
import { IWsRepository } from "@/domain/repositories/IWsRepository";
import type { WSContext } from "hono/ws";

export class WsRepository implements IWsRepository {
  private clients = new Map<string, WSClient>();
  private userClients = new Map<string, Set<string>>();

  addClient(ws: WSContext, userId: string): string {
    const id = crypto.randomUUID();
    const client = new WSClient(ws, userId);
    this.clients.set(id, client);

    let set = this.userClients.get(userId);
    if (!set) {
      set = new Set();
      this.userClients.set(userId, set);
    }
    set.add(id);

    return id;
  }

  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const userId = client.getUserId();
    const set = this.userClients.get(userId);
    if (set) {
      set.delete(clientId);
      if (set.size === 0) {
        this.userClients.delete(userId);
      }
    }

    this.clients.delete(clientId);
    try {
      client.getWs()?.close(1000, "Client removed");
    } catch {}
  }

  getUserIdByClientId(clientId: string): string | null {
    const client = this.clients.get(clientId);
    return client ? client.getUserId() : null;
  }

  getClientIdsForUser(userId: string): string[] {
    const set = this.userClients.get(userId);
    return set ? Array.from(set) : [];
  }

  getWsForClient(clientId: string): WSContext | undefined {
    const client = this.clients.get(clientId);
    return client ? client.getWs() : undefined;
  }

  sendToClient(clientId: string, payload: string): void {
    const ws = this.getWsForClient(clientId);
    if (!ws) return;

    try {
      ws.send(payload);
    } catch (e) {
      try {
        ws.close(1011, "Internal server error");
      } catch {}
    }
  }

  sendToUser(userId: string, payload: string): void {
    const clientIds = this.getClientIdsForUser(userId);
    for (const id of clientIds) {
      this.sendToClient(id, payload);
    }
  }
}