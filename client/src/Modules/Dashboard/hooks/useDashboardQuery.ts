/**
 * Dashboard Query Hooks
 * 
 * React Query hooks for dashboard data fetching:
 * - useOverview: Get complete dashboard overview
 * - useStats: Get statistics only
 * - useRecentApplications: Get recent applications
 * - useRecommendations: Get job recommendations
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { QUERY_KEYS } from 'src/services/api/config'
import { dashboardService } from '../services'
import type {
  DashboardOverviewResponse,
  DashboardStatsResponse,
  RecentApplicationsResponse,
  JobRecommendationsResponse,
  RecentApplicationsParams,
  RecommendationsParams,
} from '../types'

// ============================================================================
// QUERY HOOKS (GET Operations)
// ============================================================================

/**
 * Hook to fetch complete dashboard overview
 * 
 * Includes: stats, recent applications, recommendations, and activity
 * Refetches every 5 minutes to keep data fresh
 * 
 * @param options - React Query options
 * @returns Query result with dashboard overview data
 * @example
 * const { data, isLoading, error } = useOverview()
 * if (data) {
 *   console.log(data.stats.applications_count)
 * }
 */
export function useOverview(
  options?: Omit<
    UseQueryOptions<DashboardOverviewResponse, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<DashboardOverviewResponse, Error>({
    queryKey: QUERY_KEYS.dashboard.overview,
    queryFn: async () => {
      const response = await dashboardService.getOverview()
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    ...options,
  })
}

/**
 * Hook to fetch dashboard statistics only
 * 
 * Lightweight endpoint for just the stats cards
 * Useful when you only need metrics
 * 
 * @param options - React Query options
 * @returns Query result with dashboard statistics
 * @example
 * const { data, isLoading } = useStats()
 */
export function useStats(
  options?: Omit<
    UseQueryOptions<DashboardStatsResponse, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<DashboardStatsResponse, Error>({
    queryKey: QUERY_KEYS.dashboard.stats,
    queryFn: async () => {
      const response = await dashboardService.getStats()
      return response.data
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    ...options,
  })
}

/**
 * Hook to fetch recent applications
 * 
 * @param params - Query parameters (limit)
 * @param options - React Query options
 * @returns Query result with recent applications
 * @example
 * const { data } = useRecentApplications({ limit: 5 })
 */
export function useRecentApplications(
  params?: RecentApplicationsParams,
  options?: Omit<
    UseQueryOptions<RecentApplicationsResponse, Error>,
    'queryKey' | 'queryFn'
  >
) {
  const paramsKey = params ? JSON.stringify(params) : 'default'

  return useQuery<RecentApplicationsResponse, Error>({
    queryKey: [QUERY_KEYS.dashboard.recentApplications, paramsKey],
    queryFn: async () => {
      const response = await dashboardService.getRecentApplications(params)
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    ...options,
  })
}

/**
 * Hook to fetch job recommendations
 * 
 * @param params - Query parameters (limit)
 * @param options - React Query options
 * @returns Query result with job recommendations
 * @example
 * const { data } = useRecommendations({ limit: 10 })
 */
export function useRecommendations(
  params?: RecommendationsParams,
  options?: Omit<
    UseQueryOptions<JobRecommendationsResponse, Error>,
    'queryKey' | 'queryFn'
  >
) {
  const paramsKey = params ? JSON.stringify(params) : 'default'

  return useQuery<JobRecommendationsResponse, Error>({
    queryKey: [QUERY_KEYS.dashboard.recommendations, paramsKey],
    queryFn: async () => {
      const response = await dashboardService.getRecommendations(params)
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: true,
    ...options,
  })
}

// ============================================================================
// Composite Hooks
// ============================================================================

/**
 * Hook to fetch all dashboard data at once
 * 
 * Useful for initial page load or full refresh
 * 
 * @param applicationsLimit - Limit for recent applications (default: 10)
 * @param recommendationsLimit - Limit for recommendations (default: 10)
 * @returns Object with all query results
 * @example
 * const { overview, stats, applications, recommendations } = useDashboardData()
 */
export function useDashboardData(
  applicationsLimit: number = 10,
  recommendationsLimit: number = 10
) {
  const overview = useOverview()
  const stats = useStats({ enabled: false }) // Disable since included in overview
  const applications = useRecentApplications(
    { limit: applicationsLimit },
    { enabled: false } // Disable since included in overview
  )
  const recommendations = useRecommendations(
    { limit: recommendationsLimit },
    { enabled: false } // Disable since included in overview
  )

  return {
    overview,
    stats,
    applications,
    recommendations,
    isLoading: overview.isLoading,
    error: overview.error,
    refetch: overview.refetch,
  }
}
