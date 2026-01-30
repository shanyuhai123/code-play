import type { Template } from '../types/project'

export const TEMPLATES: Template[] = [
  {
    id: 'react',
    name: 'react',
    icon: '/template-react.svg',
    description: '快速开始 react 开发',
  },
  {
    id: 'vue',
    name: 'vue',
    icon: '/template-vue.svg',
    description: '快速开始 vue 开发',
  },
  {
    id: 'vanilla',
    name: 'vanilla',
    icon: '/template-js.svg',
    description: '快速开始 vanilla 开发',
  },
  {
    id: 'vanilla-ts',
    name: 'vanilla-ts',
    icon: '/template-ts.svg',
    description: '快速开始 vanilla-ts 开发',
  },
]

export const TEMPLATE_IDS = TEMPLATES.map(t => t.id)
