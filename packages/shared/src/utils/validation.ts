import { z } from 'zod'
import { TEMPLATE_IDS } from '../constants/templates'

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  templateId: z.enum(TEMPLATE_IDS as [string, ...string[]]),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
})

export const createSandboxSchema = z.object({
  projectId: z.string().uuid(),
})

export const executeCommandSchema = z.object({
  sandboxId: z.string().uuid(),
  command: z.string().min(1),
  cwd: z.string().optional(),
})
