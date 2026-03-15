import type { Template } from './project'

export const TEMPLATES: Template[] = [
  {
    id: 'vue',
    name: 'Vue',
    icon: '/template-vue.svg',
    description: '快速开始 Vue 开发',
    viteTemplate: 'vue-ts',
  },
  {
    id: 'react',
    name: 'React',
    icon: '/template-react.svg',
    description: '快速开始 React 开发',
    viteTemplate: 'react-ts',
  },
  {
    id: 'vanilla',
    name: 'Vanilla',
    icon: '/template-js.svg',
    description: '快速开始 Vanilla 开发',
    viteTemplate: 'vanilla-ts',
  },
  {
    id: 'vanilla-ts',
    name: 'Vanilla TS',
    icon: '/template-ts.svg',
    description: '快速开始 Vanilla TypeScript 开发',
    viteTemplate: 'vanilla-ts',
  },
]

export const TEMPLATE_IDS: string[] = TEMPLATES.map(template => template.id)

const templateMap = new Map<string, string>(TEMPLATES.map(template => [template.id, template.viteTemplate]))

export function resolveViteTemplate(templateId: string) {
  return templateMap.get(templateId) ?? 'vanilla-ts'
}
