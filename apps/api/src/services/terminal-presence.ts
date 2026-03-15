import { redis } from '../lib/redis.js'

const WRITER_LEASE_SECONDS = 30

function clientsKey(projectId: string) {
  return `runtime:${projectId}:clients`
}

function writerKey(projectId: string) {
  return `runtime:${projectId}:writer`
}

export async function addProjectClient(projectId: string, clientId: string) {
  await redis.sAdd(clientsKey(projectId), clientId)
}

export async function removeProjectClient(projectId: string, clientId: string) {
  await redis.sRem(clientsKey(projectId), clientId)
}

export async function countProjectClients(projectId: string) {
  return redis.sCard(clientsKey(projectId))
}

export async function getWriterClientId(projectId: string) {
  return redis.get(writerKey(projectId))
}

export async function claimWriter(projectId: string, clientId: string) {
  const claimed = await redis.set(writerKey(projectId), clientId, {
    NX: true,
    EX: WRITER_LEASE_SECONDS,
  })

  if (claimed) {
    return clientId
  }

  const current = await redis.get(writerKey(projectId))
  if (current === clientId) {
    await renewWriter(projectId, clientId)
    return clientId
  }

  return current
}

export async function renewWriter(projectId: string, clientId: string) {
  const current = await redis.get(writerKey(projectId))
  if (current !== clientId) {
    return false
  }

  await redis.expire(writerKey(projectId), WRITER_LEASE_SECONDS)
  return true
}

export async function releaseWriter(projectId: string, clientId: string) {
  const current = await redis.get(writerKey(projectId))
  if (current !== clientId) {
    return false
  }

  await redis.del(writerKey(projectId))
  return true
}

export async function clearProjectPresence(projectId: string) {
  await redis.del(clientsKey(projectId))
  await redis.del(writerKey(projectId))
}
