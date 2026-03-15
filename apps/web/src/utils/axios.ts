import type { ApiResponse } from '@code-play/contracts'
import axios from 'axios'

const service = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVER_PATH,
  timeout: 6000 * 60,
})

service.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse
    if (!data || !data.success) {
      return Promise.reject(new Error(data?.error?.message || '请求失败'))
    }
    return data.data as any
  },
  (error) => {
    const data = error.response?.data
    const message = data?.error?.message ?? error.message
    return Promise.reject(new Error(message || '请求失败'))
  },
)

export { service as axios }
