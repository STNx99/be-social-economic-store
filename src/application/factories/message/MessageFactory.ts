import { createServerMessage, ServerMessage } from "./ServerMessage";
import { createClientMessage, ClientMessage } from "./ClientMessage";
import { createErrorMessage, ErrorMessage } from "./ErrorMessage";

/**
 * MessageFactory
 *
 * Centralized helpers to create and serialize messages used across the app
 * (WS, internal event bus, etc.).
 */
export class MessageFactory {
  static createServer<T = unknown>(
    type: string,
    payload?: T,
    meta?: Record<string, unknown>,
    id?: string,
  ): ServerMessage<T> {
    return createServerMessage(type, payload, meta, id);
  }

  static createClient<T = unknown>(
    type: string,
    payload?: T,
    source?: string,
    id?: string,
  ): ClientMessage<T> {
    return createClientMessage(type, payload, source, id);
  }

  static createError(
    type: string,
    message: string,
    code?: string,
    details?: unknown,
    meta?: Record<string, unknown>,
    id?: string,
  ): ErrorMessage {
    return createErrorMessage(type, message, code, details, meta, id);
  }

  static serialize(message: unknown): string {
    return JSON.stringify(message);
  }

  static parse<T = unknown>(raw: string): T | null {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
}