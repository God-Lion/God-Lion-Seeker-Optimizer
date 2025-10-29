// src/Modules/Statistics/hooks/useStatisticsQuery.ts

import {
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query'
import { AxiosError, AxiosResponse } from 'axios'
import { statisticsService } from '../services/statistics.service'
import {
  DashboardOverview,
  JobsByLocation,
  JobsByCompany,
  JobsByType,
  JobsByExperience,
  ScrapingActivity,
  TopSkill,
  RecentJob,
  SessionStatistics,
  JobTrends,
  LocationStatsParams,
  CompanyStatsParams,
  ScrapingActivityParams,
  TopSkillsParams,
  RecentJobsParams,
  JobTrendsParams,
} from '../types/api.types'

/**
 * Query Keys for Statistics
 */
export const STATISTICS_QUERY_KEYS = {
  all: ['statistics'] as const,
  overview: ['statistics', 'overview'] as const,
  jobsByLocation: (params: LocationStatsParams) => ['statistics', 'jobs-by-location', params] as const,
  jobsByCompany: (params: CompanyStatsParams) => ['statistics', 'jobs-by-company', params] as const,
  jobsByType: ['statistics', 'jobs-by-type'] as const,
  jobsByExperience: ['statistics', 'jobs-by-experience'] as const,
  scrapingActivity: (params: ScrapingActivityParams) => ['statistics', 'scraping-activity', params] as const,
  topSkills: (params: TopSkillsParams) => ['statistics', 'top-skills', params] as const,
  recentJobs: (params: RecentJobsParams) => ['statistics', 'recent-jobs', params] as const,
  sessionStatistics: ['statistics', 'session-statistics'] as const,
  jobTrends: (params: JobTrendsParams) => ['statistics', 'job-trends', params] as const,
} as const

/**
 * Query Hooks (GET operations)
 */

/**
 * Get dashboard overview statistics
 */
export function useDashboardOverview(
  options?: Omit<
    UseQueryOptions<AxiosResponse<DashboardOverview>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.overview,
    queryFn: () => statisticsService.getDashboardOverview(),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refetch every 5 minutes
    ...options,
  })
}

/**
 * Get jobs by location
 */
export function useJobsByLocation(
  params: LocationStatsParams = {},
  options?: Omit<
    UseQueryOptions<AxiosResponse<JobsByLocation[]>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.jobsByLocation(params),
    queryFn: () => statisticsService.getJobsByLocation(params),
    staleTime: 1000 * 60 * 5,
    ...options,
  })
}

/**
 * Get jobs by company
 */
export function useJobsByCompany(
  params: CompanyStatsParams = {},
  options?: Omit<
    UseQueryOptions<AxiosResponse<JobsByCompany[]>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.jobsByCompany(params),
    queryFn: () => statisticsService.getJobsByCompany(params),
    staleTime: 1000 * 60 * 5,
    ...options,
  })
}

/**
 * Get jobs by type
 */
export function useJobsByType(
  options?: Omit<
    UseQueryOptions<AxiosResponse<JobsByType[]>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.jobsByType,
    queryFn: () => statisticsService.getJobsByType(),
    staleTime: 1000 * 60 * 5,
    ...options,
  })
}

/**
 * Get jobs by experience level
 */
export function useJobsByExperience(
  options?: Omit<
    UseQueryOptions<AxiosResponse<JobsByExperience[]>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.jobsByExperience,
    queryFn: () => statisticsService.getJobsByExperience(),
    staleTime: 1000 * 60 * 5,
    ...options,
  })
}

/**
 * Get scraping activity
 */
export function useScrapingActivity(
  params: ScrapingActivityParams = {},
  options?: Omit<
    UseQueryOptions<AxiosResponse<ScrapingActivity[]>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.scrapingActivity(params),
    queryFn: () => statisticsService.getScrapingActivity(params),
    staleTime: 1000 * 60 * 5,
    ...options,
  })
}

/**
 * Get top skills
 */
export function useTopSkills(
  params: TopSkillsParams = {},
  options?: Omit<
    UseQueryOptions<AxiosResponse<TopSkill[]>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.topSkills(params),
    queryFn: () => statisticsService.getTopSkills(params),
    staleTime: 1000 * 60 * 5,
    ...options,
  })
}

/**
 * Get recent jobs
 */
export function useRecentJobs(
  params: RecentJobsParams = {},
  options?: Omit<
    UseQueryOptions<AxiosResponse<RecentJob[]>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.recentJobs(params),
    queryFn: () => statisticsService.getRecentJobs(params),
    staleTime: 1000 * 60 * 2, // Recent jobs change frequently
    ...options,
  })
}

/**
 * Get session statistics
 */
export function useSessionStatistics(
  options?: Omit<
    UseQueryOptions<AxiosResponse<SessionStatistics>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.sessionStatistics,
    queryFn: () => statisticsService.getSessionStatistics(),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    ...options,
  })
}

/**
 * Get job trends
 */
export function useJobTrends(
  params: JobTrendsParams = {},
  options?: Omit<
    UseQueryOptions<AxiosResponse<JobTrends>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.jobTrends(params),
    queryFn: () => statisticsService.getJobTrends(params),
    staleTime: 1000 * 60 * 10,
    ...options,
  })
}
