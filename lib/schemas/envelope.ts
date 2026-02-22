import { z, type ZodType } from "zod";

/**
 * Creates a zod schema for ApiEnvelope<T>.
 * Pass the inner data schema to get full runtime validation.
 */
export function apiEnvelopeSchema<T>(dataSchema: ZodType<T>) {
  return z
    .object({
      data: dataSchema,
      meta: z.record(z.unknown()).optional(),
      message: z.string().optional(),
      error: z.unknown().optional(),
      timestamp: z.string().optional(),
    })
    .passthrough();
}

export const paginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
