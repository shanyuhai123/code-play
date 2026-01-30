FROM node:24-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY packages/sandbox-manager/package.json ./packages/sandbox-manager/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/sandbox-manager ./packages/sandbox-manager
COPY packages/shared ./packages/shared

# Build shared package
RUN pnpm --filter @code-play/shared build

# Build sandbox-manager
RUN pnpm --filter @code-play/sandbox-manager build

# Expose port
EXPOSE 3001

# Start the application
CMD ["pnpm", "--filter", "@code-play/sandbox-manager", "start"]
