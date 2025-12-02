import { z } from 'zod';
import { EmailSchema, NameSchema, IDSchema, DateSchema, PasswordSchema } from '@/utils/schemas/common';

/**
 * User entity schema with validation rules
 */
export const UserSchema = z.object({
  id: IDSchema,
  email: EmailSchema,
  name: NameSchema,
  password: PasswordSchema,
  createdAt: DateSchema,
  updatedAt: DateSchema
}).refine(
  (user) => user.updatedAt >= user.createdAt,
  {
    message: 'Updated date cannot be before creation date',
    path: ['updatedAt']
  }
);

/**
 * Schema for validating user creation input
 */
export const CreateUserSchema = z.object({
  email: EmailSchema,
  name: NameSchema,
  password: PasswordSchema
});

/**
 * Schema for validating user update input (at least one field required)
 */
export const UpdateUserSchema = z.object({
  name: NameSchema.optional(),
  email: EmailSchema.optional(),
  password: PasswordSchema.optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided for update'
);

/**
 * Raw user input schema for API validation
 */
export const UserInputSchema = z.object({
  email: EmailSchema,
  name: NameSchema,
  password: PasswordSchema
}).strict();

/**
 * Sanitized user input schema with data transformation
 */
export const SanitizedUserInputSchema = UserInputSchema.transform((data) => ({
  email: data.email.trim().toLowerCase(),
  name: data.name.trim(),
  password: data.password
}));

/**
 * Schema for validating user ID parameters
 */
export const UserIdParamSchema = z.object({
  id: IDSchema
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UserInput = z.infer<typeof UserInputSchema>;
export type SanitizedUserInput = z.infer<typeof SanitizedUserInputSchema>;
export type UserIdParams = z.infer<typeof UserIdParamSchema>;