// src/Modules/Statistics/hooks/useStatisticsManagement.ts

import { useState, useCallback, useMemo } from 'react'
import {
  useDashboardOverview,
  useJobsByCompany,
  useJobsByType,
  useJobsByExperience,
  useScrapingActivity,
  useTopSkills,
  useSessionStatistics,
  useJobTrends,
} from './useStatisticsQuery'

/**
 * Time range options for statistics
 */
export type TimeRange = 7 | 30 | 90 | 365

/**
 * Business logic hook for Statistics Management
 * Manages complex state and operations for statistics screens
 */
export const useStatisticsManagement = (initialTimeRange: TimeRange = 30) => {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange)
  const [topCompaniesLimit, setTopCompaniesLimit] = useState(10)
  const [topSkillsLimit, setTopSkillsLimit] = useState(20)

  // Fetch all statistics data
  const overviewQuery = useDashboardOverview()
  const sessionStatsQuery = useSessionStatistics()
  const jobsByTypeQuery = useJobsByType()
  const jobsByExperienceQuery = useJobsByExperience()
  
  const jobsByCompanyQuery = useJobsByCompany({ limit: topCompaniesLimit })
  const scrapingActivityQuery = useScrapingActivity({ days: timeRange })
  const topSkillsQuery = useTopSkills({ limit: topSkillsLimit })
  const jobTrendsQuery = useJobTrends({ days: timeRange })

  // Combine loading states
  const isLoading = useMemo(
    () =>
      overviewQuery.isLoading ||
      sessionStatsQuery.isLoading ||
      jobsByTypeQuery.isLoading ||
      jobsByExperienceQuery.isLoading ||
      jobsByCompanyQuery.isLoading ||
      scrapingActivityQuery.isLoading ||
      topSkillsQuery.isLoading ||
      jobTrendsQuery.isLoading,
    [
      overviewQuery.isLoading,
      sessionStatsQuery.isLoading,
      jobsByTypeQuery.isLoading,
      jobsByExperienceQuery.isLoading,
      jobsByCompanyQuery.isLoading,
      scrapingActivityQuery.isLoading,
      topSkillsQuery.isLoading,
      jobTrendsQuery.isLoading,
    ]
  )

  // Combine fetching states
  const isFetching = useMemo(
    () =>
      overviewQuery.isFetching ||
      sessionStatsQuery.isFetching ||
      jobsByTypeQuery.isFetching ||
      jobsByExperienceQuery.isFetching ||
      jobsByCompanyQuery.isFetching ||
      scrapingActivityQuery.isFetching ||
      topSkillsQuery.isFetching ||
      jobTrendsQuery.isFetching,
    [
      overviewQuery.isFetching,
      sessionStatsQuery.isFetching,
      jobsByTypeQuery.isFetching,
      jobsByExperienceQuery.isFetching,
      jobsByCompanyQuery.isFetching,
      scrapingActivityQuery.isFetching,
      topSkillsQuery.isFetching,
      jobTrendsQuery.isFetching,
    ]
  )

  // Check for errors
  const error = useMemo(() => {
    const queries = [
      overviewQuery,
      sessionStatsQuery,
      jobsByTypeQuery,
      jobsByExperienceQuery,
      jobsByCompanyQuery,
      scrapingActivityQuery,
      topSkillsQuery,
      jobTrendsQuery,
    ]

    const errorQuery = queries.find((q) => q.error)
    return errorQuery?.error?.message || null
  }, [
    overviewQuery,
    sessionStatsQuery,
    jobsByTypeQuery,
    jobsByExperienceQuery,
    jobsByCompanyQuery,
    scrapingActivityQuery,
    topSkillsQuery,
    jobTrendsQuery,
  ])

  // Extract data safely
  const overview = useMemo(() => overviewQuery.data?.data || null, [overviewQuery.data])
  const sessionStats = useMemo(() => sessionStatsQuery.data?.data || null, [sessionStatsQuery.data])
  const jobsByType = useMemo(() => jobsByTypeQuery.data?.data || [], [jobsByTypeQuery.data])
  const jobsByExperience = useMemo(() => jobsByExperienceQuery.data?.data || [], [jobsByExperienceQuery.data])
  const jobsByCompany = useMemo(() => jobsByCompanyQuery.data?.data || [], [jobsByCompanyQuery.data])
  const scrapingActivity = useMemo(() => scrapingActivityQuery.data?.data || [], [scrapingActivityQuery.data])
  const topSkills = useMemo(() => topSkillsQuery.data?.data || [], [topSkillsQuery.data])
  const jobTrends = useMemo(() => jobTrendsQuery.data?.data || null, [jobTrendsQuery.data])

  /**
   * Update time range
   */
  const updateTimeRange = useCallback((newTimeRange: TimeRange) => {
    setTimeRange(newTimeRange)
  }, [])

  /**
   * Update top companies limit
   */
  const updateTopCompaniesLimit = useCallback((limit: number) => {
    setTopCompaniesLimit(limit)
  }, [])

  /**
   * Update top skills limit
   */
  const updateTopSkillsLimit = useCallback((limit: number) => {
    setTopSkillsLimit(limit)
  }, [])

  /**
   * Refresh all statistics
   */
  const refreshAll = useCallback(() => {
    overviewQuery.refetch()
    sessionStatsQuery.refetch()
    jobsByTypeQuery.refetch()
    jobsByExperienceQuery.refetch()
    jobsByCompanyQuery.refetch()
    scrapingActivityQuery.refetch()
    topSkillsQuery.refetch()
    jobTrendsQuery.refetch()
  }, [
    overviewQuery,
    sessionStatsQuery,
    jobsByTypeQuery,
    jobsByExperienceQuery,
    jobsByCompanyQuery,
    scrapingActivityQuery,
    topSkillsQuery,
    jobTrendsQuery,
  ])

  return {
    // State
    timeRange,
    topCompaniesLimit,
    topSkillsLimit,

    // Data
    overview,
    sessionStats,
    jobsByType,
    jobsByExperience,
    jobsByCompany,
    scrapingActivity,
    topSkills,
    jobTrends,

    // Loading states
    isLoading,
    isFetching,
    error,

    // Actions
    updateTimeRange,
    updateTopCompaniesLimit,
    updateTopSkillsLimit,
    refreshAll,

    // Computed
    hasData: !!(overview || sessionStats || jobsByType.length > 0),
    timeRangeLabel: timeRange === 7 ? 'Last 7 days' : 
                    timeRange === 30 ? 'Last 30 days' : 
                    timeRange === 90 ? 'Last 90 days' : 'Last year',
  }
}
