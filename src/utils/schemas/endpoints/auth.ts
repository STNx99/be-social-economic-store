import z from "zod";
import { IDSchema } from "../common";

export const AuthLoginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const AuthLoginResponseSchema = z.object({
  accessToken: z.string(),
});

export const AuthRegisterRequestSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  password: z.string().min(6),
});

export const AuthRegisterResponseSchema = z.object({
  id: IDSchema,
  name: z.string(),
  email: z.email(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AuthLoginRequest = z.infer<typeof AuthLoginRequestSchema>;
export type AuthLoginResponse = z.infer<typeof AuthLoginResponseSchema>;
export type AuthRegisterRequest = z.infer<typeof AuthRegisterRequestSchema>;
export type AuthRegisterResponse = z.infer<typeof AuthRegisterResponseSchema>;