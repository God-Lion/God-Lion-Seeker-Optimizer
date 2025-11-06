// src/Modules/Jobs/hooks/useJobsManagement.ts

import { useState, useCallback, useMemo } from 'react'
import { JobSearchParams } from '@/types/job'
import { useJobs, useJobSearch, useDeleteJob } from './useJobsQuery'

/**
 * State interface for jobs management
 */
interface JobsManagementState {
  searchQuery: string
  location: string
  company: string
  date_posted: JobSearchParams['date_posted']
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
    date_posted: 'all',
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
      date_posted: state.date_posted,
    }),
    [
      state.currentPage,
      state.itemsPerPage,
      state.company,
      state.location,
      state.date_posted,
    ],
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
    },
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
   * Update multiple filters at once
   */
  const setFilters = useCallback((filters: Partial<JobSearchParams>) => {
    setState((prev) => ({ ...prev, ...filters, currentPage: 1 }))
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
    [deleteMutation],
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
      date_posted: 'all',
      searchQuery: '',
      currentPage: 1,
      viewMode: 'list',
    }))
  }, [])

  return {
    // State
    searchQuery: state.searchQuery,
    filters: {
      location: state.location,
      company: state.company,
      date_posted: state.date_posted,
    },
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
    setFilters,
    executeSearch,
    resetToList,
    setPage,
    deleteJob,
    refresh,

    // Computed
    isSearchMode: state.viewMode === 'search',
  }
}
