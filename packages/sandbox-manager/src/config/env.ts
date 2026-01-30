import 'dotenv/config'

export const config = {
  port: Number(process.env.SANDBOX_MANAGER_PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  docker: {
    socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
    sandboxImage: process.env.SANDBOX_IMAGE || 'code-play-sandbox:latest',
    networkName: 'code-play-network',
  },
}
