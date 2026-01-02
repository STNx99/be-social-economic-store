import { z } from "zod";
import { UserSchema } from "../user";
import { EmailSchema, NameSchema, PasswordSchema, IDSchema } from "../common";
import { createEndpointResponseSchema, BaseResponseSchema } from "../responses/common";

/**
 * Schema for creating a new user via API
 */
export const CreateUserRequestSchema = z.object({
  email: EmailSchema,
  name: NameSchema,
  password: PasswordSchema,
});

/**
 * Response schema for user creation
 */
export const CreateUserResponseSchema = createEndpointResponseSchema(UserSchema);

/**
 * Schema for getting a user by ID via API
 */
export const GetUserRequestSchema = z.object({
  id: IDSchema,
});

/**
 * Response schema for getting a user
 */
export const GetUserResponseSchema = createEndpointResponseSchema(UserSchema);

/**
 * Response schema for listing users
 */
export const ListUsersResponseSchema = BaseResponseSchema.extend({
  data: z.array(UserSchema).optional(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }).optional(),
});

// Type exports
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
export type GetUserRequest = z.infer<typeof GetUserRequestSchema>;
export type GetUserResponse = z.infer<typeof GetUserResponseSchema>;
export type ListUsersResponse = z.infer<typeof ListUsersResponseSchema>;