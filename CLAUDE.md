# CLAUDE.md

## 项目目标

实现类似 CodeSandbox、StackBlitz 的代码沙盒。

## 技术栈

### 前端

- **构建**: Vite (rolldown-vite@7.2.5) + TypeScript + pnpm
- **框架**: Vue@3 + Vue Router@4
- **UI**: Element Plus + UnoCSS
- **编辑器**: Monaco Editor
- **终端**: xterm.js
- **文件系统**: OPFS + Dexie
- **工具库**: lodash-es + @vueuse/core + axios + nanoid + dayjs
- **代码规范**: @antfu/eslint-config + Vitest

### 后端

- **Runtime**: Node@24
- **Web 框架**: Fastify
- **WebSocket**: 同框架集成
- **数据库**: PostgreSQL + Prisma
- **缓存/队列**: Redis
- **鉴权**: GitHub OAuth

### 服务端

- **隔离**:
- **代理**: Traefik(Subdomain)

## 业务流程

1. 前端点击新建项目，发出请求
2. 后端接收请求，拉起 docker 沙盒
3. 在沙盒中使用 pnpm create vite [project name] --template [project template] 创建模板
4. 将生成的文件打包返回给前端，排除 node_modules 等文件
5. 前端拿到文件映射写入 OPFS
6. Dexie 管理项目列表、业务等信息
