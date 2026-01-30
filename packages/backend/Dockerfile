FROM node:24-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/backend ./packages/backend
COPY packages/shared ./packages/shared

# Build shared package
RUN pnpm --filter @code-play/shared build

# Generate Prisma client
RUN pnpm --filter @code-play/backend prisma:generate

# Build backend
RUN pnpm --filter @code-play/backend build

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "--filter", "@code-play/backend", "start"]
