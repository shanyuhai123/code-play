import process from 'node:process'

export const config = {
  port: Number(process.env.SANDBOX_PORT) || 3001,
  host: process.env.SANDBOX_HOST || '0.0.0.0',

  docker: {
    socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
    image: process.env.SANDBOX_IMAGE || 'code-play-sandbox:dev',
    memoryLimit: 512 * 1024 * 1024,
    cpuQuota: 100_000,
    createTimeout: 180_000,
    workDir: '/app',
    devServerPort: 5173,
  },
}
