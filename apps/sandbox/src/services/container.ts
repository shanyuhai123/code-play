import type { Buffer } from 'node:buffer'
import type { Readable } from 'node:stream'
import Dockerode from 'dockerode'
import { pack } from 'tar-stream'
import { config } from '../config.js'

const docker = new Dockerode({ socketPath: config.docker.socketPath })

export interface CreateContainerOptions {
  /**
   * 名称
   * @description 容器名称，未传时由 Docker 自动生成。
   */
  name?: string
  /**
   * 启动命令
   * @description 容器启动后执行的命令数组。
   */
  cmd?: string[]
  /**
   * 暴露端口
   * @description 需要映射到宿主机的容器端口列表。
   */
  exposePorts?: number[]
}

export async function createContainer(options: CreateContainerOptions = {}) {
  await ensureImage(config.docker.image)

  const ExposedPorts: Record<string, object> = {}
  const PortBindings: Record<string, Array<{ HostPort: string }>> = {}
  if (options.exposePorts) {
    for (const port of options.exposePorts) {
      const key = `${port}/tcp`
      ExposedPorts[key] = {}
      PortBindings[key] = [{ HostPort: '' }]
    }
  }

  const container = await docker.createContainer({
    Image: config.docker.image,
    Cmd: options.cmd || ['sleep', 'infinity'],
    WorkingDir: config.docker.workDir,
    Tty: true,
    OpenStdin: true,
    ExposedPorts,
    HostConfig: {
      Memory: config.docker.memoryLimit,
      CpuQuota: config.docker.cpuQuota,
      NetworkMode: 'bridge',
      PortBindings,
    },
    ...(options.name && { name: options.name }),
  })

  await container.start()
  return container
}

async function ensureImage(image: string) {
  try {
    await docker.getImage(image).inspect()
    return
  }
  catch (error) {
    if (!(error instanceof Error) || !('statusCode' in error) || error.statusCode !== 404) {
      throw error
    }
  }

  const stream = await docker.pull(image)
  await new Promise<void>((resolve, reject) => {
    docker.modem.followProgress(stream, (error) => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })
}

export async function removeContainer(containerId: string) {
  const container = docker.getContainer(containerId)
  try {
    await container.stop({ t: 5 })
  }
  catch {
    // 容器可能已停止
  }
  await container.remove({ force: true })
}

export async function execInContainer(containerId: string, cmd: string[]) {
  const container = docker.getContainer(containerId)
  const exec = await container.exec({
    Cmd: cmd,
    AttachStdout: true,
    AttachStderr: true,
    WorkingDir: config.docker.workDir,
  })

  const stream = await exec.start({ hijack: true, stdin: false })

  return new Promise<{ stdout: string, stderr: string }>((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    docker.modem.demuxStream(stream, {
      write: (chunk: Buffer) => {
        stdout += chunk.toString()
        return true
      },
    } as any, {
      write: (chunk: Buffer) => {
        stderr += chunk.toString()
        return true
      },
    } as any)

    stream.on('end', async () => {
      try {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }

        const result = await exec.inspect()
        if (result.ExitCode && result.ExitCode !== 0) {
          reject(new Error(stderr || stdout || `命令执行失败，退出码 ${result.ExitCode}`))
          return
        }

        resolve({ stdout, stderr })
      }
      catch (error) {
        reject(error)
      }
    })
    stream.on('error', reject)

    timeoutId = setTimeout(() => {
      stream.destroy()
      reject(new Error('执行超时'))
    }, config.docker.createTimeout)
  })
}

export async function createExecStream(containerId: string, cmd: string[]) {
  const container = docker.getContainer(containerId)
  const exec = await container.exec({
    Cmd: cmd,
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
    WorkingDir: config.docker.workDir,
  })

  const stream = await exec.start({ hijack: true, stdin: true, Tty: true })

  return {
    stream,
    inspect: () => exec.inspect(),
    resize: (cols: number, rows: number) => exec.resize({ w: cols, h: rows }),
  }
}

export async function getContainerArchive(containerId: string, path: string): Promise<Readable> {
  const container = docker.getContainer(containerId)
  const stream = await container.getArchive({ path })
  return stream as Readable
}

export async function writeProjectFiles(containerId: string, files: Array<{ path: string, content: string }>) {
  if (files.length === 0) {
    return
  }

  await execInContainer(containerId, ['mkdir', '-p', config.docker.workDir])

  const archive = pack()
  for (const file of files) {
    archive.entry({ name: file.path }, file.content)
  }
  archive.finalize()

  const container = docker.getContainer(containerId)
  await container.putArchive(archive, { path: config.docker.workDir })
}

export async function writeProjectFile(containerId: string, path: string, content: string) {
  await writeProjectFiles(containerId, [{ path, content }])
}

export async function getContainerHostPort(containerId: string, containerPort: number): Promise<number | null> {
  const container = docker.getContainer(containerId)
  const info = await container.inspect()
  const key = `${containerPort}/tcp`
  const bindings = info.NetworkSettings.Ports[key]
  if (!bindings || bindings.length === 0) {
    return null
  }

  return Number(bindings[0].HostPort)
}

export async function startDevServer(containerId: string) {
  const container = docker.getContainer(containerId)
  console.log(`Starting dev server in container ${containerId}...`)
  const exec = await container.exec({
    Cmd: ['sh', '-c', 'pnpm install && pnpm exec vite --host 0.0.0.0'],
    AttachStdout: true,
    AttachStderr: true,
    WorkingDir: config.docker.workDir,
  })

  await exec.start({ hijack: true, stdin: false })
}

export { docker }
