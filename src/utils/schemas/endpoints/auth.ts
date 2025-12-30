import { z } from "zod";
import {
  IDSchema,
  EmailSchema,
  PasswordSchema,
  NameSchema,
  DateSchema,
  UserRoleSchema,
} from "../common";
import { createEndpointResponseSchema } from "../responses/common";

/**
 * Schema for login request via API
 */
export const AuthLoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "Password is required"),
});

/**
 * Response schema for successful login
 */
export const AuthLoginResponseSchema = createEndpointResponseSchema(
  z.object({
    accessToken: z.string(),
    user: z.object({
      id: IDSchema,
      email: EmailSchema,
      name: NameSchema,
      role: UserRoleSchema,
    }),
  }),
);

/**
 * Schema for registration request via API
 */
export const AuthRegisterRequestSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  password: PasswordSchema,
});

/**
 * Response schema for successful registration
 */
export const AuthRegisterResponseSchema = createEndpointResponseSchema(
  z.object({
    id: IDSchema,
    name: NameSchema,
    email: EmailSchema,
    role: UserRoleSchema,
    createdAt: DateSchema,
    updatedAt: DateSchema,
  }),
);

/**
 * Schema for JWT access token payload
 */
export const AccessTokenPayloadSchema = z.object({
  sub: z.string().optional(),
  userId: z.string().optional(),
  role: UserRoleSchema.optional(),
  iat: z.number(),
  exp: z.number().optional(),
});

// Type exports
export type AuthLoginRequest = z.infer<typeof AuthLoginRequestSchema>;
export type AuthLoginResponse = z.infer<typeof AuthLoginResponseSchema>;
export type AuthRegisterRequest = z.infer<typeof AuthRegisterRequestSchema>;
export type AuthRegisterResponse = z.infer<typeof AuthRegisterResponseSchema>;
export type AccessTokenPayload = z.infer<typeof AccessTokenPayloadSchema>;
