/**
 * Unified Production-Ready Axios Instance
 * 
 * ✅ Features:
 * - Automatic token refresh with queue management
 * - Request retry with exponential backoff
 * - Request deduplication
 * - Async token management (non-blocking)
 * - Proper cleanup on auth failure
 * - Conditional logging (dev only)
 * - Integrates with Zustand store
 * - Backward compatible with API_CONFIG
 */

import axios from 'axios'
import { baseUrl } from './api_link'
import { tokenRefreshService } from 'src/services/tokenRefresh.service'
import { setupDeduplicationInterceptor } from './deduplicationInterceptor'

// Import API_CONFIG if it exists, otherwise use baseUrl
let API_CONFIG: any
try {
  API_CONFIG = require('src/shared/api/config').API_CONFIG
} catch {
  API_CONFIG = {
    baseURL: baseUrl(),
    timeout: 30000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  }
}

// Create axios instance with merged config
const axiosInstance = axios.create({
  ...API_CONFIG,
  baseURL: API_CONFIG.baseURL || baseUrl(),
})

// Setup token refresh interceptors from service
tokenRefreshService.setupInterceptors(axiosInstance)

// Setup request deduplication
setupDeduplicationInterceptor(axiosInstance)

// Additional logging interceptor (development only)
if (import.meta.env.DEV) {
  axiosInstance.interceptors.request.use(
    (config) => {
      console.log(
        `[API Request] ${config.method?.toUpperCase()} ${config.url}`,
        config.params ? { params: config.params } : ''
      )
      return config
    },
    (error) => {
      console.error('[API Request Error]', error)
      return Promise.reject(error)
    }
  )

  axiosInstance.interceptors.response.use(
    (response) => {
      console.log(
        `[API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`
      )
      return response
    },
    (error) => {
      console.error(
        '[API Response Error]',
        error.response?.status,
        error.config?.url,
        error.message
      )
      return Promise.reject(error)
    }
  )
}

// Export default instance
export default axiosInstance

// Export services for manual control
export { tokenRefreshService }
export { 
  withoutDeduplication, 
  withDeduplication,
  cancelAllRequests,
  clearDeduplicationCache,
  getDeduplicationStats
} from './deduplicationInterceptor'
