import { randomUUID } from "crypto";

export class ClientMessage<T = unknown> {
  type: string;
  payload?: T;
  source?: string;
  id: string;

  constructor(
    type: string,
    payload?: T,
    source?: string,
    id?: string,
  ) {
    this.type = type;
    this.payload = payload;
    this.source = source;
    this.id = id || this.generateId();
  }

  private generateId(): string {
    return randomUUID();
  }
}

export function createClientMessage<T = unknown>(
  type: string,
  payload?: T,
  source?: string,
  id?: string,
): ClientMessage<T> {
  return new ClientMessage<T>(type, payload, source, id);
}