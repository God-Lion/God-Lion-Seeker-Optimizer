/**
 * Dashboard Management Hook
 * 
 * Provides a centralized state management interface for the Dashboard screen.
 * Coordinates multiple queries and provides unified actions and computed values.
 * 
 * Features:
 * - Fetches all dashboard data
 * - Manages view mode and filters
 * - Provides refresh and navigation actions
 * - Computes derived state
 */

import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOverview } from './useDashboardQuery'
import type { DashboardViewMode, DashboardFilters } from '../types'

/**
 * Dashboard management state interface
 */
interface DashboardManagementState {
  viewMode: DashboardViewMode
  filters: DashboardFilters
  applicationsLimit: number
  recommendationsLimit: number
}

/**
 * Dashboard management hook
 * 
 * @param initialApplicationsLimit - Initial limit for applications (default: 10)
 * @param initialRecommendationsLimit - Initial limit for recommendations (default: 10)
 * @returns Dashboard management interface
 * 
 * @example
 * const dashboard = useDashboardManagement(5, 8)
 * 
 * // Access data
 * console.log(dashboard.data)
 * console.log(dashboard.stats)
 * 
 * // Use actions
 * dashboard.refreshAll()
 * dashboard.navigateToJob(123)
 * dashboard.setViewMode('applications')
 */
export const useDashboardManagement = (
  initialApplicationsLimit: number = 10,
  initialRecommendationsLimit: number = 10
) => {
  // ============================================================================
  // State Management
  // ============================================================================

  const [state, setState] = useState<DashboardManagementState>({
    viewMode: 'overview',
    filters: {},
    applicationsLimit: initialApplicationsLimit,
    recommendationsLimit: initialRecommendationsLimit,
  })

  const navigate = useNavigate()

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const {
    data: overview,
    isLoading,
    error,
    refetch,
  } = useOverview()

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Refresh all dashboard data
   */
  const refreshAll = useCallback(() => {
    refetch()
  }, [refetch])

  /**
   * Set view mode
   */
  const setViewMode = useCallback((mode: DashboardViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode }))
  }, [])

  /**
   * Update filters
   */
  const setFilters = useCallback((filters: Partial<DashboardFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
    }))
  }, [])

  /**
   * Reset filters to default
   */
  const resetFilters = useCallback(() => {
    setState(prev => ({ ...prev, filters: {} }))
  }, [])

  /**
   * Set applications limit
   */
  const setApplicationsLimit = useCallback((limit: number) => {
    setState(prev => ({ ...prev, applicationsLimit: limit }))
  }, [])

  /**
   * Set recommendations limit
   */
  const setRecommendationsLimit = useCallback((limit: number) => {
    setState(prev => ({ ...prev, recommendationsLimit: limit }))
  }, [])

  // ============================================================================
  // Navigation Actions
  // ============================================================================

  /**
   * Navigate to job details
   */
  const navigateToJob = useCallback(
    (jobId: number) => {
      navigate(`/jobs/${jobId}`)
    },
    [navigate]
  )

  /**
   * Navigate to application details
   */
  const navigateToApplication = useCallback(
    (applicationId: number) => {
      navigate(`/applications/${applicationId}`)
    },
    [navigate]
  )

  /**
   * Navigate to all applications
   */
  const navigateToApplications = useCallback(() => {
    navigate('/applications')
  }, [navigate])

  /**
   * Navigate to all saved jobs
   */
  const navigateToSavedJobs = useCallback(() => {
    navigate('/jobs/saved')
  }, [navigate])

  /**
   * Navigate to profile
   */
  const navigateToProfile = useCallback(() => {
    navigate('/profile')
  }, [navigate])

  /**
   * Navigate to job search
   */
  const navigateToJobSearch = useCallback(() => {
    navigate('/jobs/search')
  }, [navigate])

  // ============================================================================
  // Computed Values
  // ============================================================================

  /**
   * Get stats from overview data
   */
  const stats = useMemo(() => overview?.stats, [overview])

  /**
   * Get recent applications from overview data
   */
  const recentApplications = useMemo(
    () => overview?.recent_applications || [],
    [overview]
  )

  /**
   * Get recommendations from overview data
   */
  const recommendations = useMemo(
    () => overview?.recommendations || [],
    [overview]
  )

  /**
   * Get recent activity from overview data
   */
  const recentActivity = useMemo(
    () => overview?.recent_activity || [],
    [overview]
  )

  /**
   * Check if dashboard has data
   */
  const hasData = useMemo(() => !!overview, [overview])

  /**
   * Check if dashboard is empty
   */
  const isEmpty = useMemo(
    () =>
      hasData &&
      recentApplications.length === 0 &&
      recommendations.length === 0 &&
      recentActivity.length === 0,
    [hasData, recentApplications, recommendations, recentActivity]
  )

  // ============================================================================
  // Return Interface
  // ============================================================================

  return {
    // State
    viewMode: state.viewMode,
    filters: state.filters,
    applicationsLimit: state.applicationsLimit,
    recommendationsLimit: state.recommendationsLimit,

    // Data
    data: overview,
    stats,
    recentApplications,
    recommendations,
    recentActivity,
    isLoading,
    error,
    hasData,
    isEmpty,

    // Actions
    refreshAll,
    setViewMode,
    setFilters,
    resetFilters,
    setApplicationsLimit,
    setRecommendationsLimit,

    // Navigation
    navigateToJob,
    navigateToApplication,
    navigateToApplications,
    navigateToSavedJobs,
    navigateToProfile,
    navigateToJobSearch,
  }
}
