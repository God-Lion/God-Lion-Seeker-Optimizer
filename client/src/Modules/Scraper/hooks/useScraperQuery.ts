// src/Modules/Scraper/hooks/useScraperQuery.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query'
import { AxiosError, AxiosResponse } from 'axios'
import { QUERY_KEYS } from '../../../shared/api/config'
import { scraperService } from '../services/scraper.service'
import {
  ScrapeResponse,
  ScrapingSession,
  SessionsListResponse,
  StopSessionResponse,
  StartScrapingMutationVars,
  StopSessionMutationVars,
  SessionsQueryParams,
} from '../types/api.types'

/**
 * Query Hooks (GET operations)
 */

/**
 * Get all scraping sessions with filters and pagination
 */
export function useScrapingSessions(
  params: SessionsQueryParams = {},
  options?: Omit<
    UseQueryOptions<AxiosResponse<SessionsListResponse>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  const paramsString = JSON.stringify(params)
  
  return useQuery({
    queryKey: QUERY_KEYS.scraper.sessions(paramsString),
    queryFn: () => scraperService.listSessions(params),
    staleTime: 1000 * 10, // Cache for 10 seconds (short due to real-time nature)
    refetchInterval: 10000, // Auto-refetch every 10 seconds
    ...options,
  })
}

/**
 * Get a specific scraping session by ID
 */
export function useScrapingSession(
  sessionId: number | null,
  options?: Omit<
    UseQueryOptions<AxiosResponse<ScrapingSession>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: QUERY_KEYS.scraper.session(sessionId!),
    queryFn: () => scraperService.getSessionStatus(sessionId!),
    enabled: !!sessionId,
    staleTime: 1000 * 5, // Cache for 5 seconds
    refetchInterval: (query) => {
      // Auto-refetch only if session is active
      const status = query.state.data?.data?.status
      return status === 'running' || status === 'pending' ? 3000 : false
    },
    ...options,
  })
}

/**
 * Get active sessions (running or pending)
 */
export function useActiveSessions(
  options?: Omit<
    UseQueryOptions<AxiosResponse<SessionsListResponse>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: QUERY_KEYS.scraper.activeSessions,
    queryFn: () => scraperService.getActiveSessions(),
    staleTime: 1000 * 5,
    refetchInterval: 5000, // Check for active sessions every 5 seconds
    ...options,
  })
}

/**
 * Get session history
 */
export function useSessionHistory(
  limit: number = 50,
  options?: Omit<
    UseQueryOptions<AxiosResponse<SessionsListResponse>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: QUERY_KEYS.scraper.history(limit),
    queryFn: () => scraperService.getSessionHistory(limit),
    staleTime: 1000 * 60, // Cache for 1 minute
    ...options,
  })
}

/**
 * Mutation Hooks (POST operations)
 */

/**
 * Start a new scraping job
 */
export function useStartScraping(
  options?: UseMutationOptions<
    AxiosResponse<ScrapeResponse>,
    AxiosError,
    StartScrapingMutationVars
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data }) => scraperService.startScraping(data),
    onSuccess: (response) => {
      // Invalidate sessions lists to refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scraper.all })
      
      // Optionally, you can set the new session data directly
      const sessionId = response.data.session_id
      queryClient.setQueryData(
        QUERY_KEYS.scraper.session(sessionId),
        {
          data: {
            session_id: sessionId,
            query: response.data.query,
            location: response.data.location,
            status: 'pending' as const,
            jobs_found: 0,
            jobs_scraped: 0,
            started_at: response.data.timestamp,
          },
        }
      )
    },
    ...options,
  })
}

/**
 * Stop a running scraping session
 */
export function useStopSession(
  options?: UseMutationOptions<
    AxiosResponse<StopSessionResponse>,
    AxiosError,
    StopSessionMutationVars
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ session_id }) => scraperService.stopSession(session_id),
    onSuccess: (data, variables) => {
      // Update the specific session in cache
      queryClient.setQueryData(
        QUERY_KEYS.scraper.session(variables.session_id),
        (oldData: any) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            data: {
              ...oldData.data,
              status: 'stopped' as const,
              completed_at: data.data.stopped_at,
            },
          }
        }
      )

      // Invalidate sessions lists to refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scraper.all })
    },
    ...options,
  })
}

/**
 * Refresh a session's status manually
 */
export function useRefreshSession(
  options?: UseMutationOptions<
    AxiosResponse<ScrapingSession>,
    AxiosError,
    { session_id: number }
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ session_id }) => scraperService.getSessionStatus(session_id),
    onSuccess: (data, variables) => {
      // Update the session in cache
      queryClient.setQueryData(QUERY_KEYS.scraper.session(variables.session_id), data)
      
      // Invalidate sessions lists to refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scraper.sessions('{}') })
    },
    ...options,
  })
}
