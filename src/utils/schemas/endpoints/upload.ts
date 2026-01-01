import { z } from "zod";
import { createEndpointResponseSchema } from "../responses/common";

export const GeneratePresignedUrlRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  folder: z.string().optional().default("general"),
});

export const GeneratePresignedUrlResponseSchema = createEndpointResponseSchema(
  z.object({
    url: z.string().url(),
    key: z.string(),
    expiresIn: z.number(),
  })
);

export type GeneratePresignedUrlRequest = z.infer<typeof GeneratePresignedUrlRequestSchema>;
export type GeneratePresignedUrlResponse = z.infer<typeof GeneratePresignedUrlResponseSchema>;
export const UploadImageResponseSchema = createEndpointResponseSchema(
  z.object({
    url: z.string().url(),
    key: z.string(),
  })
);
export type UploadImageResponse = z.infer<typeof UploadImageResponseSchema>;