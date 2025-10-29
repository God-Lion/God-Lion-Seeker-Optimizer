// src/shared/hooks/useApi.ts

import { useState, useCallback, useRef, useEffect } from 'react'
import { AxiosResponse, AxiosError } from 'axios'
import { ApiError, handleApiError } from '../api/api-client'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
  success: boolean
}

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: ApiError) => void
  onSettled?: () => void
  initialData?: T | null
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | undefined>
  reset: () => void
  setData: (data: T | null) => void
  setError: (error: ApiError | null) => void
}

/**
 * Enhanced hook for handling API calls with better state management
 * 
 * @example
 * ```tsx
 * const { data, loading, error, execute } = useApi(
 *   (id) => apiClient.get(`/users/${id}`),
 *   {
 *     onSuccess: (data) => toast.success('User loaded'),
 *     onError: (error) => toast.error(error.message)
 *   }
 * )
 * 
 * // Later in your code
 * await execute(userId)
 * ```
 */
export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<AxiosResponse<T>>,
  options?: UseApiOptions<T>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: options?.initialData ?? null,
    loading: false,
    error: null,
    success: false,
  })

  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  const execute = useCallback(
    async (...args: any[]): Promise<T | undefined> => {
      // Cancel previous request if still pending
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()

      try {
        if (!isMountedRef.current) return

        setState((prev) => ({
          ...prev,
          loading: true,
          error: null,
          success: false,
        }))

        const response = await apiFunction(...args)
        const responseData = response.data

        if (!isMountedRef.current) return

        setState({
          data: responseData,
          loading: false,
          error: null,
          success: true,
        })

        options?.onSuccess?.(responseData)
        options?.onSettled?.()

        return responseData
      } catch (err: any) {
        if (!isMountedRef.current) return

        const apiError = handleApiError(err)

        setState({
          data: null,
          loading: false,
          error: apiError,
          success: false,
        })

        options?.onError?.(apiError)
        options?.onSettled?.()

        throw apiError
      }
    },
    [apiFunction, options]
  )

  const reset = useCallback(() => {
    abortControllerRef.current?.abort()
    setState({
      data: options?.initialData ?? null,
      loading: false,
      error: null,
      success: false,
    })
  }, [options?.initialData])

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }))
  }, [])

  const setError = useCallback((error: ApiError | null) => {
    setState((prev) => ({ ...prev, error }))
  }, [])

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
  }
}

/**
 * Hook for handling API calls that should execute immediately
 */
export function useApiEffect<T = any>(
  apiFunction: () => Promise<AxiosResponse<T>>,
  deps: any[] = [],
  options?: UseApiOptions<T>
): UseApiReturn<T> {
  const apiState = useApi(apiFunction, options)

  useEffect(() => {
    apiState.execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return apiState
}

/**
 * Hook for handling multiple API calls in parallel
 */
export function useApiAll<T extends any[] = any[]>(
  apiFunctions: Array<(...args: any[]) => Promise<AxiosResponse>>,
  options?: UseApiOptions<T>
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  })

  const execute = useCallback(
    async (...args: any[]): Promise<T | undefined> => {
      try {
        setState((prev) => ({
          ...prev,
          loading: true,
          error: null,
          success: false,
        }))

        const responses = await Promise.all(
          apiFunctions.map((fn) => fn(...args))
        )
        const data = responses.map((res) => res.data) as T

        setState({
          data,
          loading: false,
          error: null,
          success: true,
        })

        options?.onSuccess?.(data)
        return data
      } catch (err: any) {
        const apiError = handleApiError(err)

        setState({
          data: null,
          loading: false,
          error: apiError,
          success: false,
        })

        options?.onError?.(apiError)
        throw apiError
      }
    },
    [apiFunctions, options]
  )

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    })
  }, [])

  return {
    ...state,
    execute,
    reset,
    setData: () => {},
    setError: () => {},
  }
}
