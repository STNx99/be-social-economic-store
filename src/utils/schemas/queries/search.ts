import { z } from "zod";

export const SearchQuerySchema = z.object({
  q: z.string().optional(),
  filters: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;