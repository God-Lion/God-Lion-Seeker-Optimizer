/**
 * Axios Request Deduplication Interceptor
 * 
 * Automatically deduplicates identical API requests using the
 * RequestDeduplicator utility.
 * 
 * Usage:
 * import { setupDeduplicationInterceptor } from './deduplicationInterceptor'
 * setupDeduplicationInterceptor(axiosInstance)
 */

import { AxiosInstance, AxiosRequestConfig } from 'axios'
import { requestDeduplicator } from './requestDeduplication'

/**
 * Setup request deduplication interceptor on an axios instance
 */
export function setupDeduplicationInterceptor(axiosInstance: AxiosInstance): void {
  // Store original request method
  const originalRequest = axiosInstance.request.bind(axiosInstance)

  // Override request method to add deduplication
  axiosInstance.request = function <R = any, D = any>(
    config: AxiosRequestConfig<D>
  ): Promise<R> {
    return requestDeduplicator.deduplicateRequest(
      config,
      (deduplicatedConfig) => originalRequest(deduplicatedConfig)
    ) as Promise<R>
  }
}

/**
 * Remove deduplication interceptor (restore original behavior)
 */
export function removeDeduplicationInterceptor(): void {
  // Clear all pending requests
  requestDeduplicator.cancelAllRequests()
  requestDeduplicator.clearCache()
}

/**
 * Helper to disable deduplication for a specific request
 */
export function withoutDeduplication<T = any>(
  config: AxiosRequestConfig<T>
): AxiosRequestConfig<T> {
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-No-Deduplication': 'true',
    },
  }
}

/**
 * Helper to force deduplication for a specific request (even for POST/PUT/etc)
 */
export function withDeduplication<T = any>(
  config: AxiosRequestConfig<T>
): AxiosRequestConfig<T> {
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-Deduplicate': 'true',
    },
  }
}

/**
 * Cancel all pending deduplicated requests
 */
export function cancelAllRequests(): void {
  requestDeduplicator.cancelAllRequests()
}

/**
 * Clear deduplication cache
 */
export function clearDeduplicationCache(): void {
  requestDeduplicator.clearCache()
}

/**
 * Get deduplication statistics
 */
export function getDeduplicationStats() {
  return requestDeduplicator.getStats()
}
