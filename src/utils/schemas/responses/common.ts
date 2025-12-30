import { z } from "zod";

/**
 * Schema for validation error details
 */
export const ValidationErrorDetailSchema = z.object({
  field: z.string(),
  message: z.string(),
});

/**
 * Base response structure for all API responses
 */
export const BaseResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().nullable().optional(),
  details: z.array(ValidationErrorDetailSchema).optional(),
});

/**
 * Factory for success response schemas
 */
export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

/**
 * Base error response schema
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.array(ValidationErrorDetailSchema).optional(),
});

/**
 * Specific error response for validation failures
 */
export const ValidationErrorSchema = ErrorResponseSchema.extend({
  details: z.array(ValidationErrorDetailSchema),
});

/**
 * Standard HTTP error response schemas
 */
export const BadRequestResponseSchema = ErrorResponseSchema.extend({
  error: z.literal("Bad Request"),
});

export const UnauthorizedResponseSchema = ErrorResponseSchema.extend({
  error: z.literal("Unauthorized"),
});

export const ForbiddenResponseSchema = ErrorResponseSchema.extend({
  error: z.literal("Forbidden"),
});

export const NotFoundResponseSchema = ErrorResponseSchema.extend({
  error: z.literal("Not Found"),
});

export const InternalServerErrorResponseSchema = ErrorResponseSchema.extend({
  error: z.literal("Internal Server Error"),
});

/**
 * Helper function to create a success response schema
 */
export function createSuccessResponseSchema<T extends z.ZodTypeAny>(
  dataSchema: T,
) {
  return SuccessResponseSchema(dataSchema);
}

/**
 * Helper function to create an error response schema with a specific message
 */
export function createErrorResponseSchema(message: string) {
  return ErrorResponseSchema.extend({
    error: z.literal(message),
  });
}

/**
 * Helper function to create a standard endpoint response schema
 */
export function createEndpointResponseSchema<T extends z.ZodTypeAny>(
  dataSchema: T,
) {
  return BaseResponseSchema.extend({
    data: dataSchema.optional(),
  });
}

// Type exports
export type ValidationErrorDetail = z.infer<typeof ValidationErrorDetailSchema>;
export type BaseResponse = z.infer<typeof BaseResponseSchema>;
export type BadRequestResponse = z.infer<typeof BadRequestResponseSchema>;
export type UnauthorizedResponse = z.infer<typeof UnauthorizedResponseSchema>;
export type ForbiddenResponse = z.infer<typeof ForbiddenResponseSchema>;
export type NotFoundResponse = z.infer<typeof NotFoundResponseSchema>;
export type InternalServerErrorResponse = z.infer<
  typeof InternalServerErrorResponseSchema
>;