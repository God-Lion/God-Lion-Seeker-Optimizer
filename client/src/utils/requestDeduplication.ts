/**
 * Request Deduplication Utility
 * 
 * Prevents duplicate API requests by caching in-flight requests
 * and returning the same promise for identical requests.
 * 
 * Features:
 * - Automatic deduplication of identical requests
 * - Configurable cache TTL
 * - Request key generation based on method, URL, params, and data
 * - Automatic cleanup of completed requests
 * - Support for custom cache keys
 * - Memory-efficient with automatic garbage collection
 */

import { AxiosRequestConfig, AxiosResponse } from 'axios'

interface PendingRequest {
  promise: Promise<AxiosResponse>
  timestamp: number
  controller: AbortController
}

interface DeduplicationOptions {
  /**
   * Time in milliseconds to keep request in cache after completion
   * Default: 0 (immediate cleanup)
   */
  cacheTTL?: number
  
  /**
   * Maximum number of pending requests to track
   * Default: 100
   */
  maxPendingRequests?: number
  
  /**
   * Custom key generator function
   */
  keyGenerator?: (config: AxiosRequestConfig) => string
  
  /**
   * Enable debug logging
   */
  debug?: boolean
}

class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest> = new Map()
  private completedCache: Map<string, { response: AxiosResponse; timestamp: number }> = new Map()
  private options: Required<DeduplicationOptions>

  constructor(options: DeduplicationOptions = {}) {
    this.options = {
      cacheTTL: options.cacheTTL ?? 0,
      maxPendingRequests: options.maxPendingRequests ?? 100,
      keyGenerator: options.keyGenerator ?? this.defaultKeyGenerator,
      debug: options.debug ?? false,
    }

    // Cleanup old entries every 30 seconds
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 30000)
    }
  }

  /**
   * Generate a unique key for the request
   */
  private defaultKeyGenerator(config: AxiosRequestConfig): string {
    const method = config.method?.toUpperCase() || 'GET'
    const url = config.url || ''
    const params = config.params ? JSON.stringify(config.params) : ''
    const data = config.data ? JSON.stringify(config.data) : ''
    
    return `${method}:${url}:${params}:${data}`
  }

  /**
   * Generate request key
   */
  private generateKey(config: AxiosRequestConfig): string {
    return this.options.keyGenerator(config)
  }

  /**
   * Check if request should be deduplicated
   */
  private shouldDeduplicate(config: AxiosRequestConfig): boolean {
    // Don't deduplicate if explicitly disabled
    if (config.headers?.['X-No-Deduplication'] === 'true') {
      return false
    }

    // Only deduplicate GET requests by default
    // Can be overridden with X-Deduplicate header
    const method = config.method?.toUpperCase() || 'GET'
    const forceDeduplicate = config.headers?.['X-Deduplicate'] === 'true'
    
    return forceDeduplicate || method === 'GET'
  }

  /**
   * Get or create a deduplicated request
   */
  public deduplicateRequest<T = any>(
    config: AxiosRequestConfig,
    requestExecutor: (config: AxiosRequestConfig) => Promise<AxiosResponse<T>>
  ): Promise<AxiosResponse<T>> {
    // Check if deduplication is enabled for this request
    if (!this.shouldDeduplicate(config)) {
      return requestExecutor(config)
    }

    const key = this.generateKey(config)

    // Check completed cache first
    if (this.options.cacheTTL > 0) {
      const cached = this.completedCache.get(key)
      if (cached && Date.now() - cached.timestamp < this.options.cacheTTL) {
        if (this.options.debug) {
          console.log(`[Dedup] Cache hit: ${key}`)
        }
        return Promise.resolve({ ...cached.response })
      }
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(key)
    if (pending) {
      if (this.options.debug) {
        console.log(`[Dedup] Reusing pending request: ${key}`)
      }
      return pending.promise as Promise<AxiosResponse<T>>
    }

    // Enforce max pending requests limit
    if (this.pendingRequests.size >= this.options.maxPendingRequests) {
      this.cleanupOldestRequest()
    }

    // Create abort controller for this request
    const controller = new AbortController()
    const configWithSignal = {
      ...config,
      signal: controller.signal,
    }

    // Create new request
    if (this.options.debug) {
      console.log(`[Dedup] Creating new request: ${key}`)
    }

    const promise = requestExecutor(configWithSignal)
      .then((response) => {
        // Cache completed request if TTL is set
        if (this.options.cacheTTL > 0) {
          this.completedCache.set(key, {
            response,
            timestamp: Date.now(),
          })
        }

        // Remove from pending after a short delay to allow concurrent requests to reuse
        setTimeout(() => {
          this.pendingRequests.delete(key)
        }, 100)

        return response
      })
      .catch((error) => {
        // Remove from pending on error
        this.pendingRequests.delete(key)
        throw error
      })

    // Store pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
      controller,
    })

    return promise
  }

  /**
   * Cancel a specific request by key
   */
  public cancelRequest(config: AxiosRequestConfig): void {
    const key = this.generateKey(config)
    const pending = this.pendingRequests.get(key)
    
    if (pending) {
      pending.controller.abort()
      this.pendingRequests.delete(key)
      
      if (this.options.debug) {
        console.log(`[Dedup] Cancelled request: ${key}`)
      }
    }
  }

  /**
   * Cancel all pending requests
   */
  public cancelAllRequests(): void {
    if (this.options.debug) {
      console.log(`[Dedup] Cancelling all ${this.pendingRequests.size} pending requests`)
    }

    this.pendingRequests.forEach((pending) => {
      pending.controller.abort()
    })
    
    this.pendingRequests.clear()
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.pendingRequests.clear()
    this.completedCache.clear()
    
    if (this.options.debug) {
      console.log('[Dedup] Cache cleared')
    }
  }

  /**
   * Cleanup old entries
   */
  private cleanup(): void {
    const now = Date.now()
    const maxAge = 60000 // 1 minute

    // Cleanup old pending requests (likely stale)
    this.pendingRequests.forEach((pending, key) => {
      if (now - pending.timestamp > maxAge) {
        pending.controller.abort()
        this.pendingRequests.delete(key)
      }
    })

    // Cleanup old completed cache
    if (this.options.cacheTTL > 0) {
      this.completedCache.forEach((cached, key) => {
        if (now - cached.timestamp > this.options.cacheTTL) {
          this.completedCache.delete(key)
        }
      })
    }
  }

  /**
   * Remove oldest pending request to enforce limit
   */
  private cleanupOldestRequest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    this.pendingRequests.forEach((pending, key) => {
      if (pending.timestamp < oldestTime) {
        oldestTime = pending.timestamp
        oldestKey = key
      }
    })

    if (oldestKey) {
      const pending = this.pendingRequests.get(oldestKey)
      if (pending) {
        pending.controller.abort()
      }
      this.pendingRequests.delete(oldestKey)
    }
  }

  /**
   * Get statistics
   */
  public getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      cachedResponses: this.completedCache.size,
      maxPendingRequests: this.options.maxPendingRequests,
      cacheTTL: this.options.cacheTTL,
    }
  }
}

// Export singleton instance
export const requestDeduplicator = new RequestDeduplicator({
  cacheTTL: 5000, // 5 seconds cache for completed requests
  maxPendingRequests: 100,
  debug: import.meta.env.DEV,
})

// Export class for custom instances
export { RequestDeduplicator }
export type { DeduplicationOptions }
