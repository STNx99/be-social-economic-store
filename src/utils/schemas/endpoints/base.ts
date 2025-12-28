import z from "zod";

export const BaseResponseSchema = z.object({
  success: z.boolean().default(true),
  error: z.string().nullable().default(null),
});

export const DetailsSchema = z
  .array(
    z.object({
      field: z.string(),
      message: z.string(),
    }),
  )
  .optional();

export const createResponseSchema = <T extends z.ZodTypeAny = z.ZodTypeAny>(
  dataSchema?: T,
) => {
  if (dataSchema) {
    return BaseResponseSchema.extend({
      data: (dataSchema as z.ZodTypeAny).optional(),
      details: DetailsSchema,
    }) as z.ZodTypeAny;
  }

  return BaseResponseSchema.extend({
    details: DetailsSchema,
  }) as z.ZodTypeAny;
};

export type BaseResponse = z.infer<typeof BaseResponseSchema>;