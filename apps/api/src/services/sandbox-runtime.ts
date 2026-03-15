import type { SandboxSession } from '@code-play/domain'
import { ERROR_CODES } from '@code-play/contracts'
import { SandboxRuntimeStatus } from '@code-play/domain'
import { prisma } from '../lib/prisma.js'
import { createSession, destroySession, getSession } from './sandbox-client.js'

function toSandboxSession(session: {
  id: string
  projectId: string
  containerId: string
  status: string
  createdAt: Date
  updatedAt: Date
}): SandboxSession {
  return {
    ...session,
    status: session.status as SandboxSession['status'],
  }
}

function buildPreviewUrl(previewPort: number | null): string | null {
  if (!previewPort) {
    return null
  }

  return `http://localhost:${previewPort}`
}

async function markSessionStopped(sessionId: string) {
  await prisma.sandboxSession.update({
    where: { id: sessionId },
    data: { status: SandboxRuntimeStatus.STOPPED },
  })
}

export async function ensureProjectSandbox(projectId: string): Promise<{ session: SandboxSession, previewUrl: string | null }> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      files: {
        orderBy: { path: 'asc' },
      },
      sessions: {
        where: { status: SandboxRuntimeStatus.RUNNING },
        orderBy: { updatedAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!project) {
    throw new Error(ERROR_CODES.PROJECT_NOT_FOUND)
  }

  if (project.status !== 'ready') {
    throw new Error(ERROR_CODES.PROJECT_NOT_READY)
  }

  const existing = project.sessions[0]
  if (existing) {
    const sessionState = await getSession(existing.id)
    if (sessionState.success) {
      const previewUrl = buildPreviewUrl(sessionState.data?.previewPort ?? null)
      return { session: toSandboxSession(existing), previewUrl }
    }

    await markSessionStopped(existing.id)
  }

  const result = await createSession(
    project.id,
    project.files.map(file => ({
      path: file.path,
      content: file.content,
    })),
  )

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || ERROR_CODES.SANDBOX_CREATION_FAILED)
  }

  await prisma.sandboxSession.updateMany({
    where: {
      projectId: project.id,
      status: SandboxRuntimeStatus.RUNNING,
      id: { not: result.data.sessionId },
    },
    data: {
      status: SandboxRuntimeStatus.STOPPED,
    },
  })

  const session = await prisma.sandboxSession.upsert({
    where: { id: result.data.sessionId },
    create: {
      id: result.data.sessionId,
      projectId: project.id,
      containerId: result.data.containerId,
      status: SandboxRuntimeStatus.RUNNING,
    },
    update: {
      projectId: project.id,
      containerId: result.data.containerId,
      status: SandboxRuntimeStatus.RUNNING,
    },
  })

  const previewUrl = buildPreviewUrl(result.data.previewPort)
  return { session: toSandboxSession(session), previewUrl }
}

export async function getLiveProjectSandbox(projectId: string): Promise<SandboxSession | null> {
  const session = await prisma.sandboxSession.findFirst({
    where: {
      projectId,
      status: SandboxRuntimeStatus.RUNNING,
    },
    orderBy: { updatedAt: 'desc' },
  })

  if (!session) {
    return null
  }

  const sessionState = await getSession(session.id)
  if (sessionState.success) {
    return toSandboxSession(session)
  }

  await markSessionStopped(session.id)
  return null
}

export async function stopProjectSandbox(projectId: string) {
  const session = await prisma.sandboxSession.findFirst({
    where: {
      projectId,
      status: SandboxRuntimeStatus.RUNNING,
    },
    orderBy: { updatedAt: 'desc' },
  })

  if (!session) {
    return null
  }

  const result = await destroySession(session.id)
  if (!result.success) {
    if (result.error?.code === ERROR_CODES.SANDBOX_NOT_FOUND) {
      await markSessionStopped(session.id)
      return session
    }

    throw new Error(result.error?.message || ERROR_CODES.SANDBOX_EXECUTION_FAILED)
  }

  await markSessionStopped(session.id)

  return session
}
