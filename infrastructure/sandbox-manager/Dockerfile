FROM node:24-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/sandbox-manager/package.json ./packages/sandbox-manager/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/sandbox-manager ./packages/sandbox-manager
COPY packages/shared ./packages/shared

# Build shared package
WORKDIR /app/packages/shared
RUN pnpm build

# Build sandbox-manager
WORKDIR /app/packages/sandbox-manager
RUN pnpm build

# Production stage
FROM node:24-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/sandbox-manager/package.json ./packages/sandbox-manager/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=builder /app/packages/sandbox-manager/dist ./packages/sandbox-manager/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

WORKDIR /app/packages/sandbox-manager

EXPOSE 3001

CMD ["node", "dist/index.js"]
