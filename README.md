# Code Play

一个类似 CodeSandbox、StackBlitz 的在线代码沙盒平台。

## 项目结构

这是一个基于 pnpm workspace 的 monorepo 项目，包含以下包：

```
code-play/
├── packages/
│   ├── frontend/          # Vue 3 前端应用
│   ├── backend/           # Fastify 后端 API 服务
│   ├── sandbox-manager/   # Docker 沙盒管理服务
│   └── shared/            # 共享类型、常量和工具函数
└── infrastructure/        # Docker、Traefik 等基础设施配置
```

## 技术栈

### 前端
- **框架**: Vue 3 + Vue Router 4
- **构建**: Vite (rolldown-vite) + TypeScript
- **UI**: Element Plus + UnoCSS
- **编辑器**: Monaco Editor
- **终端**: xterm.js
- **文件系统**: OPFS + Dexie
- **工具库**: lodash-es, @vueuse/core, axios, nanoid, dayjs

### 后端
- **Runtime**: Node.js 24
- **框架**: Fastify
- **数据库**: PostgreSQL + Prisma
- **缓存/队列**: Redis
- **认证**: GitHub OAuth + JWT
- **WebSocket**: @fastify/websocket

### 沙盒管理
- **容器**: Docker + Dockerode
- **隔离**: Docker 容器隔离
- **代理**: Traefik (子域名路由)

## 快速开始

### 前置要求

- Node.js 24+
- pnpm 10+
- Docker & Docker Compose
- PostgreSQL 16+ (可通过 Docker 启动)
- Redis 7+ (可通过 Docker 启动)

### 安装依赖

```bash
pnpm install
```

### 构建共享包

```bash
pnpm --filter @code-play/shared build
```

### 启动基础设施

```bash
# 启动 PostgreSQL 和 Redis
pnpm docker:up
```

### 数据库迁移

```bash
# 生成 Prisma Client
pnpm --filter @code-play/backend prisma:generate

# 运行数据库迁移
pnpm prisma:migrate
```

### 启动开发服务器

```bash
# 启动所有服务（并行）
pnpm dev

# 或者单独启动
pnpm dev:frontend   # http://localhost:5173
pnpm dev:backend    # http://localhost:3000
pnpm dev:sandbox    # http://localhost:3001
```

## 环境变量配置

每个服务都有对应的 `.env.example` 文件，复制并修改为 `.env`：

```bash
# Backend
cp packages/backend/.env.example packages/backend/.env

# Sandbox Manager
cp packages/sandbox-manager/.env.example packages/sandbox-manager/.env
```

## 开发指南

### 添加新的共享类型

1. 在 `packages/shared/src/types/` 中添加类型定义
2. 在 `packages/shared/src/types/index.ts` 中导出
3. 运行 `pnpm --filter @code-play/shared build` 重新构建

### 数据库变更

```bash
# 修改 packages/backend/src/prisma/schema.prisma 后

# 创建迁移
pnpm --filter @code-play/backend prisma:migrate

# 查看数据库
pnpm prisma:studio
```

### 构建生产版本

```bash
# 构建所有包
pnpm build

# 启动生产环境
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d
```

## 项目脚本

### 根目录脚本

- `pnpm dev` - 启动所有开发服务器（并行）
- `pnpm build` - 构建所有包
- `pnpm test` - 运行所有测试
- `pnpm lint` - 检查代码规范
- `pnpm lint:fix` - 自动修复代码规范问题
- `pnpm docker:up` - 启动 Docker 服务
- `pnpm docker:down` - 停止 Docker 服务

### 包特定脚本

```bash
# Frontend
pnpm --filter @code-play/frontend dev
pnpm --filter @code-play/frontend build

# Backend
pnpm --filter @code-play/backend dev
pnpm --filter @code-play/backend build
pnpm --filter @code-play/backend prisma:generate
pnpm --filter @code-play/backend prisma:migrate

# Sandbox Manager
pnpm --filter @code-play/sandbox-manager dev
pnpm --filter @code-play/sandbox-manager build

# Shared
pnpm --filter @code-play/shared build
pnpm --filter @code-play/shared dev  # watch mode
```

## 端口分配

- **Frontend**: 5173
- **Backend**: 3000
- **Sandbox Manager**: 3001
- **PostgreSQL**: 5432
- **Redis**: 6379
- **Traefik Dashboard**: 8080

## 业务流程

1. 用户在前端点击"新建项目"，选择模板（React/Vue/Vanilla/Vanilla-TS）
2. 前端发送请求到后端 API
3. 后端接收请求，调用 Sandbox Manager 创建沙盒
4. Sandbox Manager 拉起 Docker 容器，执行 `pnpm create vite` 创建项目
5. 生成的文件打包返回给后端（排除 node_modules）
6. 后端将文件返回给前端
7. 前端将文件写入 OPFS（浏览器本地文件系统）
8. Dexie 管理项目元数据（项目列表、配置等）
9. 用户在 Monaco Editor 中编辑代码
10. 通过 WebSocket 实时同步到沙盒容器
11. xterm.js 终端连接到容器，执行命令

## 架构特点

### Monorepo 优势
- 统一的依赖管理
- 共享类型定义，类型安全
- 统一的代码规范和构建流程
- 便于跨包重构

### 微服务架构
- Backend: 处理业务逻辑、认证、数据持久化
- Sandbox Manager: 专注于容器管理，独立扩展
- 服务间通过 HTTP/WebSocket 通信

### 安全隔离
- Docker 容器隔离用户代码
- 资源限制（CPU、内存、网络）
- Traefik 反向代理，子域名隔离

## 待实现功能

- [ ] 完整的路由和服务层实现
- [ ] GitHub OAuth 认证
- [ ] WebSocket 实时通信
- [ ] Monaco Editor 集成
- [ ] xterm.js 终端集成
- [ ] OPFS 文件系统操作
- [ ] 沙盒容器生命周期管理
- [ ] 项目模板系统
- [ ] 文件上传/下载
- [ ] 实时协作功能

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 许可证

MIT

## 相关文档

- [Vite 文档](https://vitejs.dev/)
- [Vue 3 文档](https://vuejs.org/)
- [Fastify 文档](https://fastify.dev/)
- [Prisma 文档](https://www.prisma.io/docs)
- [Docker 文档](https://docs.docker.com/)
- [Traefik 文档](https://doc.traefik.io/traefik/)
