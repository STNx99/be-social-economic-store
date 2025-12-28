import { WSContext } from "hono/ws";

export class WSClient {
  private ws: WSContext;
  private userId: string;
  private createdAt: Date;

  constructor(ws: WSContext, userId: string) {
    this.ws = ws;
    this.userId = userId;
    this.createdAt = new Date();
  }

  getWs(): WSContext {
    return this.ws;
  }

  getUserId(): string {
    return this.userId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  setWs(ws: WSContext): void {
    this.ws = ws;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  setCreatedAt(createdAt: Date): void {
    this.createdAt = createdAt;
  }
}
