import { z } from 'zod';
import { EmailSchema, NameSchema, PasswordSchema, UserRoleSchema } from './common';
import { 
  BaseEntityFields, 
  entityDateRefinement, 
  atLeastOneFieldRefinement, 
  createIdParamSchema 
} from './entity';

/**
 * User entity schema with validation rules
 */
export const UserSchema = z.object({
  ...BaseEntityFields,
  email: EmailSchema,
  name: NameSchema,
  password: PasswordSchema,
  role: UserRoleSchema,
}).refine(...entityDateRefinement);

/**
 * Schema for validating user creation input
 */
export const CreateUserSchema = z.object({
  email: EmailSchema,
  name: NameSchema,
  password: PasswordSchema,
  role: UserRoleSchema.optional(),
});

/**
 * Schema for validating user update input (at least one field required)
 */
export const UpdateUserSchema = z.object({
  name: NameSchema.optional(),
  email: EmailSchema.optional(),
  password: PasswordSchema.optional(),
  role: UserRoleSchema.optional(),
}).refine(...atLeastOneFieldRefinement);

/**
 * Raw user input schema for API validation
 */
export const UserInputSchema = z.object({
  email: EmailSchema,
  name: NameSchema,
  password: PasswordSchema,
  role: UserRoleSchema.optional(),
}).strict();

/**
 * Sanitized user input schema with data transformation
 */
export const SanitizedUserInputSchema = UserInputSchema.transform((data) => ({
  email: data.email.trim().toLowerCase(),
  name: data.name.trim(),
  password: data.password,
  role: data.role,
}));

/**
 * Schema for validating user ID parameters
 */
export const UserIdParamSchema = createIdParamSchema();

// Type exports
export type User = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UserInput = z.infer<typeof UserInputSchema>;
export type SanitizedUserInput = z.infer<typeof SanitizedUserInputSchema>;
export type UserIdParams = z.infer<typeof UserIdParamSchema>;