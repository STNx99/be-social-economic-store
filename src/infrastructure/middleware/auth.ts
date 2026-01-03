import type { Context, Next } from "hono";
import { Container } from "@/infrastructure/dependencies/Container";
import {
  getTokenFromAuthHeader,
  verifyAccessToken,
} from "@/utils/auth";
import { StatusBuilder } from "@/utils";
import { UserRole } from "@/utils/schemas/common";

/**
 * Auth middleware for Hono routes.
 *
 * Usage:
 *  app.get('/api/protected', requireAuth(), (c) => { ... })
 *
 * This middleware:
 * - extracts token from Authorization header (supports `Bearer <token>` and raw token),
 * - validates token format and expiration,
 * - looks up the user by id and attaches user info to the context via `c.set('user', user)`,
 * - if invalid, responds with 401.
 */
export function requireAuth() {
  return async (c: Context, next: Next) => {
    try {
      const header = c.req.header("Authorization") || c.req.header("Sec-WebSocket-Protocol");
      let token = getTokenFromAuthHeader(header);

      if (!token) {
        const qp = (c.req.query("token") || c.req.query("access_token")) as string | undefined;
        if (qp) {
          token = getTokenFromAuthHeader(qp);
        }
      }

      if (!token) {
        return c.json(StatusBuilder.fail("Unauthorized"), 401);
      }

      const verification = verifyAccessToken(token);
      if (!verification.valid) {
        return c.json(
          StatusBuilder.fail("Unauthorized", [
            { field: "token", message: String(verification.reason) },
          ]),
          401,
        );
      }

      const userId = verification.payload.userId;
      const user = await Container.getInstance().getUserRepository().findById(userId);
      if (!user) {
        return c.json(StatusBuilder.fail("Unauthorized"), 401);
      }

      // Attach user info to context for downstream handlers/controllers
      c.set("user", {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
      c.set("userId", user.id);
      c.set("role", user.role);

      await next();
    } catch (err) {
      console.error("[AuthMiddleware] Error verifying auth token", err);
      return c.json(StatusBuilder.fail("Unauthorized"), 401);
    }
  };
}

/**
 * Middleware to restrict access to admin users only.
 * Must be used after requireAuth() to ensure user info is present in context.
 *
 * Usage:
 *  app.post('/api/products', requireAuth(), requireAdmin(), (c) => { ... })
 */
export function requireAdmin() {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    const role = c.get("role") as UserRole | undefined;

    if (!user || role !== "admin") {
      return c.json(
        StatusBuilder.fail("Forbidden: Admin access required"),
        403,
      );
    }

    await next();
  };
}

/**
 * Helper to read the authenticated user from the context (if present).
 * Returns `null` when no authenticated user exists on the context.
 */
export function getAuthenticatedUser(c: Context) {
  try {
    return c.get("user") ?? null;
  } catch {
    return null;
  }
}