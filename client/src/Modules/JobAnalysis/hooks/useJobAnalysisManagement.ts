// src/Modules/JobAnalysis/hooks/useJobAnalysisManagement.ts

import { useState, useCallback, useMemo } from 'react'
import {
  useAnalysisStats,
  useRecommendedJobs,
  useDeleteAnalysis,
  useUpdateAnalysis,
} from './useJobAnalysisQuery'
import { RecommendedJobsParams, UpdateAnalysisRequest } from '../types'

/**
 * State interface for job analysis management
 */
interface JobAnalysisManagementState {
  minMatchScore: number
  currentPage: number
  itemsPerPage: number
  selectedJobs: number[]
  filterRecommended: boolean
}

/**
 * Business logic hook for Job Analysis Management
 * Manages complex state and operations for job analysis screens
 */
export const useJobAnalysisManagement = (initialItemsPerPage: number = 20) => {
  const [state, setState] = useState<JobAnalysisManagementState>({
    minMatchScore: 0,
    currentPage: 1,
    itemsPerPage: initialItemsPerPage,
    selectedJobs: [],
    filterRecommended: false,
  })

  // Build query params
  const recommendedParams: RecommendedJobsParams = useMemo(
    () => ({
      skip: (state.currentPage - 1) * state.itemsPerPage,
      limit: state.itemsPerPage,
      min_match_score: state.minMatchScore > 0 ? state.minMatchScore : undefined,
    }),
    [state.currentPage, state.itemsPerPage, state.minMatchScore]
  )

  // Fetch data
  const statsQuery = useAnalysisStats()
  const recommendedQuery = useRecommendedJobs(recommendedParams, {
    enabled: !state.filterRecommended,
  })

  // Mutations
  const deleteMutation = useDeleteAnalysis()
  const updateMutation = useUpdateAnalysis()

  // Extract data
  const stats = statsQuery.data || null
  const recommendedJobs = recommendedQuery.data?.data || []
  const totalJobs = recommendedQuery.data?.total || 0
  const totalPages = Math.ceil(totalJobs / state.itemsPerPage)
  const isLoading = statsQuery.isLoading || recommendedQuery.isLoading || recommendedQuery.isFetching
  const error = statsQuery.error?.message || recommendedQuery.error?.message || null

  /**
   * Update minimum match score filter
   */
  const setMinMatchScore = useCallback((score: number) => {
    setState((prev) => ({
      ...prev,
      minMatchScore: score,
      currentPage: 1,
    }))
  }, [])

  /**
   * Toggle recommended filter
   */
  const toggleRecommendedFilter = useCallback(() => {
    setState((prev) => ({
      ...prev,
      filterRecommended: !prev.filterRecommended,
      currentPage: 1,
    }))
  }, [])

  /**
   * Change page
   */
  const setPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, currentPage: page }))
  }, [])

  /**
   * Change items per page
   */
  const setItemsPerPage = useCallback((itemsPerPage: number) => {
    setState((prev) => ({
      ...prev,
      itemsPerPage,
      currentPage: 1,
    }))
  }, [])

  /**
   * Toggle job selection
   */
  const toggleJobSelection = useCallback((jobId: number) => {
    setState((prev) => ({
      ...prev,
      selectedJobs: prev.selectedJobs.includes(jobId)
        ? prev.selectedJobs.filter((id) => id !== jobId)
        : [...prev.selectedJobs, jobId],
    }))
  }, [])

  /**
   * Select all jobs on current page
   */
  const selectAllJobs = useCallback(() => {
    const currentJobIds = recommendedJobs.map((job) => job.id)
    setState((prev) => ({
      ...prev,
      selectedJobs: [...new Set([...prev.selectedJobs, ...currentJobIds])],
    }))
  }, [recommendedJobs])

  /**
   * Deselect all jobs
   */
  const deselectAllJobs = useCallback(() => {
    setState((prev) => ({ ...prev, selectedJobs: [] }))
  }, [])

  /**
   * Delete a single analysis
   */
  const deleteAnalysis = useCallback(
    async (jobId: number) => {
      try {
        await deleteMutation.mutateAsync({ jobId })
        // Remove from selection if it was selected
        setState((prev) => ({
          ...prev,
          selectedJobs: prev.selectedJobs.filter((id) => id !== jobId),
        }))
        return true
      } catch (error) {
        console.error('Failed to delete analysis:', error)
        return false
      }
    },
    [deleteMutation]
  )

  /**
   * Update an analysis
   */
  const updateAnalysis = useCallback(
    async (jobId: number, data: UpdateAnalysisRequest) => {
      try {
        await updateMutation.mutateAsync({ jobId, data })
        return true
      } catch (error) {
        console.error('Failed to update analysis:', error)
        return false
      }
    },
    [updateMutation]
  )

  /**
   * Refresh current view
   */
  const refresh = useCallback(() => {
    statsQuery.refetch()
    recommendedQuery.refetch()
  }, [statsQuery, recommendedQuery])

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      minMatchScore: 0,
      filterRecommended: false,
      currentPage: 1,
    }))
  }, [])

  /**
   * Get match score distribution
   */
  const matchScoreDistribution = useMemo(() => {
    return {
      excellent: recommendedJobs.filter((j) => j.match_score >= 80).length,
      good: recommendedJobs.filter((j) => j.match_score >= 60 && j.match_score < 80).length,
      fair: recommendedJobs.filter((j) => j.match_score >= 40 && j.match_score < 60).length,
      poor: recommendedJobs.filter((j) => j.match_score < 40).length,
    }
  }, [recommendedJobs])

  /**
   * Calculate average scores
   */
  const averageScores = useMemo(() => {
    if (recommendedJobs.length === 0) {
      return {
        skills: 0,
        experience: 0,
        education: 0,
      }
    }

    return {
      skills: Math.round(
        recommendedJobs.reduce((sum, job) => sum + job.analysis.skills_match, 0) /
          recommendedJobs.length
      ),
      experience: Math.round(
        recommendedJobs.reduce((sum, job) => sum + job.analysis.experience_match, 0) /
          recommendedJobs.length
      ),
      education: Math.round(
        recommendedJobs.reduce((sum, job) => sum + job.analysis.education_match, 0) /
          recommendedJobs.length
      ),
    }
  }, [recommendedJobs])

  return {
    // State
    minMatchScore: state.minMatchScore,
    currentPage: state.currentPage,
    itemsPerPage: state.itemsPerPage,
    selectedJobs: state.selectedJobs,
    filterRecommended: state.filterRecommended,

    // Data
    stats,
    recommendedJobs,
    totalJobs,
    totalPages,
    isLoading,
    error,
    matchScoreDistribution,
    averageScores,

    // Actions
    setMinMatchScore,
    toggleRecommendedFilter,
    setPage,
    setItemsPerPage,
    toggleJobSelection,
    selectAllJobs,
    deselectAllJobs,
    deleteAnalysis,
    updateAnalysis,
    refresh,
    clearFilters,

    // Computed
    hasFilters: state.minMatchScore > 0 || state.filterRecommended,
    hasSelectedJobs: state.selectedJobs.length > 0,
    selectedJobsCount: state.selectedJobs.length,
  }
}
