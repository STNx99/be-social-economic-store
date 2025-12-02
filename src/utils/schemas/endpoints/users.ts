import { z } from "zod";
import { UserSchema } from "../user";
import { PasswordSchema } from "../common";

export const CreateUserRequestSchema = z.object({
  email: z.string(),
  name: z.string(),
  password: PasswordSchema,
});

export const CreateUserResponseSchema = z.object({
  success: z.boolean(),
  data: UserSchema.optional(),
  error: z.string().optional(),
  details: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});

export const GetUserRequestSchema = z.object({
  id: z.string(),
});

export const GetUserResponseSchema = z.object({
  success: z.boolean(),
  data: UserSchema.optional(),
  error: z.string().optional(),
  details: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
export type GetUserRequest = z.infer<typeof GetUserRequestSchema>;
export type GetUserResponse = z.infer<typeof GetUserResponseSchema>;