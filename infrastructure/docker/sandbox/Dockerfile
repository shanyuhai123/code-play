FROM node:24-alpine

WORKDIR /sandbox

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install basic tools
RUN apk add --no-cache git curl

# Set resource limits
ENV NODE_OPTIONS="--max-old-space-size=512"

# Create non-root user
RUN addgroup -g 1001 sandbox && \
    adduser -D -u 1001 -G sandbox sandbox

USER sandbox

CMD ["/bin/sh"]
