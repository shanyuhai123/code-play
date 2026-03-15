import process from 'node:process'

export const config = {
  port: Number(process.env.API_PORT) || 3000,
  host: process.env.API_HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/code_play',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  sandbox: {
    baseUrl: process.env.SANDBOX_URL || 'http://localhost:3001',
  },
}
