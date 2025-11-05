// src/Modules/Companies/hooks/useCompaniesManagement.ts

import { useState, useCallback, useMemo } from 'react'
import { CompanySearchParams } from '../types'
import { useCompanies, useCompanySearch, useDeleteCompany } from './useCompaniesQuery'

/**
 * State interface for companies management
 */
interface CompaniesManagementState {
  searchQuery: string
  industryFilter: string
  sizeFilter: string
  currentPage: number
  itemsPerPage: number
  selectedCompanies: number[]
  viewMode: 'list' | 'search'
}

/**
 * Business logic hook for Companies Management
 * Manages complex state and operations for company management screens
 */
export const useCompaniesManagement = (initialItemsPerPage: number = 20) => {
  const [state, setState] = useState<CompaniesManagementState>({
    searchQuery: '',
    industryFilter: '',
    sizeFilter: '',
    currentPage: 1,
    itemsPerPage: initialItemsPerPage,
    selectedCompanies: [],
    viewMode: 'list',
  })

  // Build query params for list view
  const listParams: CompanySearchParams = useMemo(
    () => ({
      skip: (state.currentPage - 1) * state.itemsPerPage,
      limit: state.itemsPerPage,
      industry: state.industryFilter || undefined,
      company_size: state.sizeFilter || undefined,
    }),
    [state.currentPage, state.itemsPerPage, state.industryFilter, state.sizeFilter]
  )

  // Fetch companies based on view mode
  const companiesQuery = useCompanies(listParams, {
    enabled: state.viewMode === 'list',
  })

  const searchQuery = useCompanySearch(
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
  const deleteMutation = useDeleteCompany()

  // Get active query based on view mode
  const activeQuery = state.viewMode === 'search' ? searchQuery : companiesQuery

  // Extract data from active query
  const companies = activeQuery.data?.data.companies || []
  const totalCompanies = activeQuery.data?.data.total || 0
  const totalPages = Math.ceil(totalCompanies / state.itemsPerPage)
  const isLoading = activeQuery.isLoading || activeQuery.isFetching
  const error = activeQuery.error?.message || null

  /**
   * Update search query
   */
  const setSearchQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query }))
  }, [])

  /**
   * Update industry filter
   */
  const setIndustryFilter = useCallback((industry: string) => {
    setState((prev) => ({ ...prev, industryFilter: industry, currentPage: 1 }))
  }, [])

  /**
   * Update size filter
   */
  const setSizeFilter = useCallback((size: string) => {
    setState((prev) => ({ ...prev, sizeFilter: size, currentPage: 1 }))
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
   * Toggle company selection
   */
  const toggleCompanySelection = useCallback((companyId: number) => {
    setState((prev) => ({
      ...prev,
      selectedCompanies: prev.selectedCompanies.includes(companyId)
        ? prev.selectedCompanies.filter((id) => id !== companyId)
        : [...prev.selectedCompanies, companyId],
    }))
  }, [])

  /**
   * Select all companies on current page
   */
  const selectAllCompanies = useCallback(() => {
    const currentCompanyIds = companies.map((company) => company.id)
    setState((prev) => ({
      ...prev,
      selectedCompanies: [...new Set([...prev.selectedCompanies, ...currentCompanyIds])],
    }))
  }, [companies])

  /**
   * Deselect all companies
   */
  const deselectAllCompanies = useCallback(() => {
    setState((prev) => ({ ...prev, selectedCompanies: [] }))
  }, [])

  /**
   * Delete a single company
   */
  const deleteCompany = useCallback(
    async (companyId: number) => {
      try {
        await deleteMutation.mutateAsync({ companyId })
        // Remove from selection if it was selected
        setState((prev) => ({
          ...prev,
          selectedCompanies: prev.selectedCompanies.filter((id) => id !== companyId),
        }))
        return true
      } catch (error) {
        console.error('Failed to delete company:', error)
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
      industryFilter: '',
      sizeFilter: '',
      searchQuery: '',
      currentPage: 1,
      viewMode: 'list',
    }))
  }, [])

  return {
    // State
    searchQuery: state.searchQuery,
    industryFilter: state.industryFilter,
    sizeFilter: state.sizeFilter,
    currentPage: state.currentPage,
    itemsPerPage: state.itemsPerPage,
    selectedCompanies: state.selectedCompanies,
    viewMode: state.viewMode,

    // Data
    companies,
    totalCompanies,
    totalPages,
    isLoading,
    error,

    // Actions
    setSearchQuery,
    setIndustryFilter,
    setSizeFilter,
    executeSearch,
    resetToList,
    setPage,
    setItemsPerPage,
    toggleCompanySelection,
    selectAllCompanies,
    deselectAllCompanies,
    deleteCompany,
    refresh,
    clearFilters,

    // Computed
    hasFilters: !!(state.industryFilter || state.sizeFilter),
    isSearchMode: state.viewMode === 'search',
    hasSelectedCompanies: state.selectedCompanies.length > 0,
    selectedCompaniesCount: state.selectedCompanies.length,
  }
}
