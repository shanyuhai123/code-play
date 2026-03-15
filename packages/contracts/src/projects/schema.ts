import { TEMPLATE_IDS } from '@code-play/domain'
import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, '项目名称不能为空').max(50, '项目名称不能超过 50 个字符'),
  templateId: z.enum(TEMPLATE_IDS as [string, ...string[]], {
    errorMap: () => ({ message: '不支持的项目模板' }),
  }),
})

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1, '项目名称不能为空').max(50, '项目名称不能超过 50 个字符'),
})

export const syncProjectFileSchema = z.object({
  path: z.string().trim().min(1, '文件路径不能为空'),
  content: z.string(),
  version: z.number().int().positive().optional(),
})
