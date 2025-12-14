import { z } from "zod";
import { IDSchema, EmailSchema, PasswordSchema, NameSchema } from "../common";

export const AuthLoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "Password is required"),
});

export const AuthLoginResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    accessToken: z.string(),
    user: z.object({id: IDSchema,email: EmailSchema,name: NameSchema,}),
  }).optional(),
  error: z.string().optional(),
  details: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional(),
});

export const AuthRegisterRequestSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  password: PasswordSchema,
});

export const AuthRegisterResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({id: IDSchema,name: z.string(),email: z.string().email(),createdAt: z.date(),updatedAt: z.date(),}).optional(),//chỗ này lỗi thì đổi email: z.email();
  error: z.string().optional(),
  details: z.array(z.object({field: z.string(),message: z.string(),})).optional(),
});

export type AuthLoginRequest = z.infer<typeof AuthLoginRequestSchema>;
export type AuthLoginResponse = z.infer<typeof AuthLoginResponseSchema>;
export type AuthRegisterRequest = z.infer<typeof AuthRegisterRequestSchema>;
export type AuthRegisterResponse = z.infer<typeof AuthRegisterResponseSchema>;