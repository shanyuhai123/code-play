FROM node:24-alpine

# Install pnpm
RUN npm install -g pnpm

# Install basic tools
RUN apk add --no-cache \
    git \
    bash \
    curl \
    vim

# Create workspace directory
WORKDIR /workspace

# Set up non-root user
RUN addgroup -g 1000 sandbox && \
    adduser -D -u 1000 -G sandbox sandbox && \
    chown -R sandbox:sandbox /workspace

USER sandbox

# Keep container running
CMD ["tail", "-f", "/dev/null"]
