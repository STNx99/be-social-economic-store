import { z } from "zod";

export const ValidationErrorDetailSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.array(ValidationErrorDetailSchema).optional(),
});

export const ValidationErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.array(ValidationErrorDetailSchema),
});

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

export type ValidationErrorDetail = z.infer<typeof ValidationErrorDetailSchema>;
export type BadRequestResponse = z.infer<typeof BadRequestResponseSchema>;
export type UnauthorizedResponse = z.infer<typeof UnauthorizedResponseSchema>;
export type ForbiddenResponse = z.infer<typeof ForbiddenResponseSchema>;
export type NotFoundResponse = z.infer<typeof NotFoundResponseSchema>;
export type InternalServerErrorResponse = z.infer<
  typeof InternalServerErrorResponseSchema
>;

export function createSuccessResponseSchema<T extends z.ZodTypeAny>(
  dataSchema: T,
) {
  return SuccessResponseSchema(dataSchema);
}