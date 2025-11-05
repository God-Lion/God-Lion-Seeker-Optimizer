// src/Modules/JobsManagement/hooks/useJobsManagement.ts

import { useState, useCallback, useMemo } from 'react'
import { JobSearchParams } from '../types'
import { useJobs, useJobSearch, useDeleteJob } from './useJobsQuery'

/**
 * State interface for jobs management
 */
interface JobsManagementState {
  searchQuery: string
  location: string
  company: string
  currentPage: number
  itemsPerPage: number
  selectedJobs: number[]
  viewMode: 'list' | 'search'
}

/**
 * Business logic hook for Jobs Management
 * Manages complex state and operations for job management screens
 */
export const useJobsManagement = (initialItemsPerPage: number = 20) => {
  const [state, setState] = useState<JobsManagementState>({
    searchQuery: '',
    location: '',
    company: '',
    currentPage: 1,
    itemsPerPage: initialItemsPerPage,
    selectedJobs: [],
    viewMode: 'list',
  })

  // Build query params for list view
  const listParams: JobSearchParams = useMemo(
    () => ({
      skip: (state.currentPage - 1) * state.itemsPerPage,
      limit: state.itemsPerPage,
      company: state.company || undefined,
      location: state.location || undefined,
    }),
    [state.currentPage, state.itemsPerPage, state.company, state.location]
  )

  // Fetch jobs based on view mode
  const jobsQuery = useJobs(listParams, {
    enabled: state.viewMode === 'list',
  })

  const searchQuery = useJobSearch(
    {
      q: state.searchQuery,
      skip: (state.currentPage - 1) * state.itemsPerPage,
      limit: state.itemsPerPage,
    },
    {
      enabled: state.viewMode === 'search' && !!state.searchQuery.trim(),
    }
  )

  // Delete mutation
  const deleteMutation = useDeleteJob()

  // Get active query based on view mode
  const activeQuery = state.viewMode === 'search' ? searchQuery : jobsQuery

  // Extract data from active query
  const jobs = activeQuery.data?.data.jobs || []
  const totalJobs = activeQuery.data?.data.total || 0
  const totalPages = Math.ceil(totalJobs / state.itemsPerPage)
  const isLoading = activeQuery.isLoading || activeQuery.isFetching
  const error = activeQuery.error?.message || null

  /**
   * Update search query
   */
  const setSearchQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query }))
  }, [])

  /**
   * Update location filter
   */
  const setLocation = useCallback((location: string) => {
    setState((prev) => ({ ...prev, location, currentPage: 1 }))
  }, [])

  /**
   * Update company filter
   */
  const setCompany = useCallback((company: string) => {
    setState((prev) => ({ ...prev, company, currentPage: 1 }))
  }, [])

  /**
   * Switch to search mode
   */
  const executeSearch = useCallback(() => {
    if (state.searchQuery.trim()) {
      setState((prev) => ({
        ...prev,
        viewMode: 'search',
        currentPage: 1,
      }))
    }
  }, [state.searchQuery])

  /**
   * Reset to list view
   */
  const resetToList = useCallback(() => {
    setState((prev) => ({
      ...prev,
      viewMode: 'list',
      searchQuery: '',
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
    const currentJobIds = jobs.map((job) => job.id)
    setState((prev) => ({
      ...prev,
      selectedJobs: [...new Set([...prev.selectedJobs, ...currentJobIds])],
    }))
  }, [jobs])

  /**
   * Deselect all jobs
   */
  const deselectAllJobs = useCallback(() => {
    setState((prev) => ({ ...prev, selectedJobs: [] }))
  }, [])

  /**
   * Delete a single job
   */
  const deleteJob = useCallback(
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
        console.error('Failed to delete job:', error)
        return false
      }
    },
    [deleteMutation]
  )

  /**
   * Refresh current view
   */
  const refresh = useCallback(() => {
    activeQuery.refetch()
  }, [activeQuery])

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      location: '',
      company: '',
      searchQuery: '',
      currentPage: 1,
      viewMode: 'list',
    }))
  }, [])

  return {
    // State
    searchQuery: state.searchQuery,
    location: state.location,
    company: state.company,
    currentPage: state.currentPage,
    itemsPerPage: state.itemsPerPage,
    selectedJobs: state.selectedJobs,
    viewMode: state.viewMode,

    // Data
    jobs,
    totalJobs,
    totalPages,
    isLoading,
    error,

    // Actions
    setSearchQuery,
    setLocation,
    setCompany,
    executeSearch,
    resetToList,
    setPage,
    setItemsPerPage,
    toggleJobSelection,
    selectAllJobs,
    deselectAllJobs,
    deleteJob,
    refresh,
    clearFilters,

    // Computed
    hasFilters: !!(state.location || state.company),
    isSearchMode: state.viewMode === 'search',
    hasSelectedJobs: state.selectedJobs.length > 0,
    selectedJobsCount: state.selectedJobs.length,
  }
}
