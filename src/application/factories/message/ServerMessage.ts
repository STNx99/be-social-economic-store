import { randomUUID } from "crypto";

export class ServerMessage<T = unknown> {
  type: string;
  payload?: T;
  meta?: Record<string, unknown>;
  id: string;

  constructor(
    type: string,
    payload?: T,
    meta?: Record<string, unknown>,
    id?: string,
  ) {
    this.type = type;
    this.payload = payload;
    this.meta = meta;
    this.id = id || ServerMessage.generateId();
  }

  private static generateId(): string {
    return randomUUID();
  }
}

export function createServerMessage<T = unknown>(
  type: string,
  payload?: T,
  meta?: Record<string, unknown>,
  id?: string,
): ServerMessage<T> {
  return new ServerMessage(type, payload, meta, id);
}