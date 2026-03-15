import { z } from 'zod'

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
})

export function apiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  }).or(z.object({
    success: z.literal(false),
    error: apiErrorSchema,
  }))
}
