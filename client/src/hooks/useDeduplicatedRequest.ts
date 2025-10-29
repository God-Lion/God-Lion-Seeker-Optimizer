/**
 * React Hook for Deduplicated API Requests
 * 
 * Provides a hook-based interface for making deduplicated API requests
 * with automatic cleanup and cancellation.
 * 
 * Usage:
 * const { data, loading, error, refetch } = useDeduplicatedRequest('/api/users')
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import axiosInstance from 'src/lib/api'
import { requestDeduplicator } from 'src/lib/utils'

interface UseDeduplicatedRequestOptions<T> extends AxiosRequestConfig {
  /**
   * Enable automatic request on mount
   * Default: true
   */
  enabled?: boolean

  /**
   * Callback on success
   */
  onSuccess?: (data: T) => void

  /**
   * Callback on error
   */
  onError?: (error: AxiosError) => void

  /**
   * Refetch interval in milliseconds
   * Default: undefined (no auto-refetch)
   */
  refetchInterval?: number

  /**
   * Force deduplication even for non-GET requests
   */
  forceDeduplication?: boolean
}

interface UseDeduplicatedRequestResult<T> {
  data: T | null
  loading: boolean
  error: AxiosError | null
  refetch: () => Promise<void>
  cancel: () => void
}

export function useDeduplicatedRequest<T = any>(
  url: string,
  options: UseDeduplicatedRequestOptions<T> = {}
): UseDeduplicatedRequestResult<T> {
  const {
    enabled = true,
    onSuccess,
    onError,
    refetchInterval,
    forceDeduplication = false,
    ...axiosConfig
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(enabled)
  const [error, setError] = useState<AxiosError | null>(null)

  const isMountedRef = useRef(true)
  const refetchIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const config: AxiosRequestConfig = {
    url,
    method: 'GET',
    ...axiosConfig,
    headers: {
      ...axiosConfig.headers,
      ...(forceDeduplication && { 'X-Deduplicate': 'true' }),
    },
  }

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return

    setLoading(true)
    setError(null)

    try {
      const response: AxiosResponse<T> = await requestDeduplicator.deduplicateRequest(
        config,
        (deduplicatedConfig) => axiosInstance.request(deduplicatedConfig)
      )

      if (isMountedRef.current) {
        setData(response.data)
        setLoading(false)
        onSuccess?.(response.data)
      }
    } catch (err) {
      if (isMountedRef.current) {
        const axiosError = err as AxiosError
        setError(axiosError)
        setLoading(false)
        onError?.(axiosError)
      }
    }
  }, [url, JSON.stringify(config)])

  const cancel = useCallback(() => {
    requestDeduplicator.cancelRequest(config)
  }, [url, JSON.stringify(config)])

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData()
    }

    return () => {
      isMountedRef.current = false
      if (refetchIntervalRef.current) {
        clearInterval(refetchIntervalRef.current)
      }
    }
  }, [enabled, fetchData])

  // Setup refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      refetchIntervalRef.current = setInterval(() => {
        fetchData()
      }, refetchInterval)

      return () => {
        if (refetchIntervalRef.current) {
          clearInterval(refetchIntervalRef.current)
        }
      }
    }
  }, [refetchInterval, enabled, fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    cancel,
  }
}

/**
 * Hook for making a deduplicated mutation request (POST, PUT, DELETE, etc.)
 */
export function useDeduplicatedMutation<TData = any, TVariables = any>(
  options: Omit<UseDeduplicatedRequestOptions<TData>, 'enabled'> = {}
) {
  const [data, setData] = useState<TData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<AxiosError | null>(null)

  const { onSuccess, onError, forceDeduplication = false, ...axiosConfig } = options

  const mutate = useCallback(
    async (url: string, variables?: TVariables): Promise<TData | null> => {
      setLoading(true)
      setError(null)

      const config: AxiosRequestConfig = {
        url,
        method: 'POST',
        data: variables,
        ...axiosConfig,
        headers: {
          ...axiosConfig.headers,
          ...(forceDeduplication && { 'X-Deduplicate': 'true' }),
        },
      }

      try {
        const response: AxiosResponse<TData> = await requestDeduplicator.deduplicateRequest(
          config,
          (deduplicatedConfig) => axiosInstance.request(deduplicatedConfig)
        )

        setData(response.data)
        setLoading(false)
        onSuccess?.(response.data)
        return response.data
      } catch (err) {
        const axiosError = err as AxiosError
        setError(axiosError)
        setLoading(false)
        onError?.(axiosError)
        return null
      }
    },
    [JSON.stringify(axiosConfig), forceDeduplication, onSuccess, onError]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  }
}
