import jwt, {
  JwtPayload,
  VerifyOptions,
  TokenExpiredError,
  JsonWebTokenError,
} from "jsonwebtoken";
import { AccessTokenPayloadSchema } from "./schemas/endpoints/auth";
import { UserRole } from "./schemas/common";

export interface DecodedAccessToken {
  userId: string;
  role: UserRole;
  iat: number;
  exp?: number;
}

export const DEFAULT_ACCESS_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

/**
 * Generate a JWT access token containing userId and role.
 */
export function generateAccessToken(userId: string, role: UserRole): string {
  const expiresInSeconds = Math.floor(DEFAULT_ACCESS_TOKEN_MAX_AGE_MS / 1000);
  return jwt.sign(
    { sub: userId, role }, 
    JWT_SECRET, 
    { expiresIn: expiresInSeconds }
  );
}

/**
 * Decode a JWT without verifying signature/expiration.
 * Returns null for malformed tokens.
 */
export function decodeAccessToken(token: string): DecodedAccessToken | null {
  if (!token) return null;
  try {
    const payload = jwt.decode(token) as JwtPayload | null;
    if (!payload || typeof payload === "string") return null;
    
    const sub = payload.sub ?? (payload as any).userId;
    const role = payload.role as UserRole | undefined;
    const iat = payload.iat as number | undefined;
    const exp = payload.exp as number | undefined;
    
    if (!sub || !role || typeof iat !== "number") return null;
    
    return { userId: String(sub), role, iat, exp };
  } catch {
    return null;
  }
}

/**
 * Verify JWT signature and (optionally) maxAge.
 * Returns a normalized payload on success, or { valid: false, reason }.
 */
export function verifyAccessToken(
  token: string,
  opts?: { maxAgeMs?: number },
):
  | { valid: true; payload: DecodedAccessToken }
  | { valid: false; reason: string } {
  if (!token) return { valid: false, reason: "Missing token" };

  const verifyOpts: VerifyOptions = {};
  if (opts?.maxAgeMs) {
    verifyOpts.maxAge = `${Math.floor(opts.maxAgeMs / 1000)}s`;
  }

  try {
    const rawPayload = jwt.verify(token, JWT_SECRET, verifyOpts);

    if (typeof rawPayload === "string") {
      return { valid: false, reason: "Invalid token payload" };
    }

    const parsed = AccessTokenPayloadSchema.safeParse(rawPayload);

    if (!parsed.success) {
      return { valid: false, reason: "Invalid token payload" };
    }

    const { sub, userId, role, iat, exp } = parsed.data;

    if (!role) {
      return { valid: false, reason: "Token missing role information" };
    }

    return {
      valid: true,
      payload: { 
        userId: (sub ?? userId)!, 
        role: role as UserRole,
        iat, 
        exp 
      },
    };
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return { valid: false, reason: "Token expired" };
    }
    if (err instanceof JsonWebTokenError) {
      return { valid: false, reason: err.message };
    }
    return { valid: false, reason: "Invalid token" };
  }
}

export function getTokenFromAuthHeader(header?: string | null): string | null {
  if (!header) return null;
  const val = header.trim();
  if (val.toLowerCase().startsWith("bearer ")) {
    return val.slice(7).trim() || null;
  }
  return val || null;
}

export function getUserIdFromToken(
  token: string,
  opts?: { maxAgeMs?: number },
): string | null {
  const result = verifyAccessToken(token, opts);
  if (!result.valid) return null;
  return result.payload.userId;
}