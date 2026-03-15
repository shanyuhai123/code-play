import { z } from 'zod'

export const projectFileInputSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
})

export const createSessionSchema = z.object({
  projectId: z.string().min(1),
  files: z.array(projectFileInputSchema),
})

export const writeSessionFileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
})
