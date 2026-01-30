import Docker from 'dockerode'
import { config } from '../config/env'

export const docker = new Docker({
  socketPath: config.docker.socketPath,
})

export async function checkDockerConnection() {
  try {
    await docker.ping()
    console.log('✅ Docker connected')
    return true
  } catch (error) {
    console.error('❌ Docker connection failed:', error)
    return false
  }
}

export async function ensureNetwork() {
  try {
    const networks = await docker.listNetworks({
      filters: { name: [config.docker.networkName] },
    })

    if (networks.length === 0) {
      await docker.createNetwork({
        Name: config.docker.networkName,
        Driver: 'bridge',
      })
      console.log(`✅ Docker network '${config.docker.networkName}' created`)
    }
  } catch (error) {
    console.error('Failed to ensure network:', error)
    throw error
  }
}

export async function ensureImage() {
  try {
    const images = await docker.listImages({
      filters: { reference: [config.docker.sandboxImage] },
    })

    if (images.length === 0) {
      console.log(`⚠️  Sandbox image '${config.docker.sandboxImage}' not found`)
      console.log('Please build the image first: docker build -t code-play-sandbox:latest ./infrastructure/sandbox')
    }
  } catch (error) {
    console.error('Failed to check image:', error)
  }
}
