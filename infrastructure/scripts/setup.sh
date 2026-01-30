#!/bin/bash
set -e

echo "🚀 Setting up Code Play development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
fi

# Build sandbox image
echo "📦 Building sandbox Docker image..."
docker build -t code-play-sandbox:latest infrastructure/docker/sandbox/

# Create Docker network
echo "🌐 Creating Docker network..."
docker network create code-play-network 2>/dev/null || echo "Network already exists"

# Install dependencies
echo "📥 Installing dependencies..."
pnpm install

# Build shared package
echo "🔨 Building shared package..."
pnpm --filter @code-play/shared build

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
pnpm --filter @code-play/backend prisma:generate

# Start infrastructure
echo "🐳 Starting infrastructure (PostgreSQL, Redis)..."
docker-compose -f infrastructure/docker/docker-compose.yml up -d postgres redis

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 5

# Run database migrations
echo "🔄 Running database migrations..."
pnpm --filter @code-play/backend prisma:migrate

echo "✅ Setup complete!"
echo ""
echo "To start the development servers, run:"
echo "  pnpm dev"
echo ""
echo "Or start services individually:"
echo "  pnpm dev:frontend   # Frontend on http://localhost:5173"
echo "  pnpm dev:backend    # Backend on http://localhost:3000"
echo "  pnpm dev:sandbox    # Sandbox Manager on http://localhost:3001"
