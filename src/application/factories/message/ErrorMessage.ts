import { randomUUID } from "crypto";

/**
 * ErrorMessage
 *
 * Structured representation of an application error to be sent over transports
 * (WS, internal event bus, etc.).
 */
export class ErrorMessage {
  type: string;
  message: string;
  code?: string;
  details?: unknown;
  meta?: Record<string, unknown>;
  id: string;

  constructor(
    type: string,
    message: string,
    code?: string,
    details?: unknown,
    meta?: Record<string, unknown>,
    id?: string,
  ) {
    this.type = type;
    this.message = message;
    this.code = code;
    this.details = details;
    this.meta = meta;
    this.id = id || ErrorMessage.generateId();
  }

  private static generateId(): string {
    return randomUUID();
  }
}

/**
 * createErrorMessage
 *
 * Small factory helper to create ErrorMessage instances.
 */
export function createErrorMessage(
  type: string,
  message: string,
  code?: string,
  details?: unknown,
  meta?: Record<string, unknown>,
  id?: string,
): ErrorMessage {
  return new ErrorMessage(type, message, code, details, meta, id);
}

/**
 * ErrorFactory (legacy helper)
 *
 * Utility for formatting unknown errors into strings. Kept for backward
 * compatibility with existing code that used the previous pattern.
 */
export class ErrorFactory {
  static createErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}