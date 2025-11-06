// src/Modules/Companies/hooks/useCompaniesQuery.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query'
import { AxiosError, AxiosResponse } from 'axios'
import { QUERY_KEYS } from 'src/services/api'
import { companiesService } from '../services/companies.service'
import {
  Company,
  CompanySearchParams,
  CompanySearchQuery,
  CompanySearchResponse,
  CompanyJobsResponse,
  DeleteCompanyResponse,
  CreateCompanyMutationVars,
  UpdateCompanyMutationVars,
  DeleteCompanyMutationVars,
} from '../types/api.types'

/**
 * Query Hooks (GET operations)
 */

/**
 * Get all companies with filters and pagination
 */
export function useCompanies(
  params: CompanySearchParams = {},
  options?: Omit<
    UseQueryOptions<AxiosResponse<CompanySearchResponse>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  const paramsString = JSON.stringify(params)
  
  return useQuery({
    queryKey: QUERY_KEYS.companies.list(paramsString),
    queryFn: () => companiesService.getCompanies(params),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    ...options,
  })
}

/**
 * Get a specific company by ID
 */
export function useCompany(
  companyId: number | null,
  options?: Omit<
    UseQueryOptions<AxiosResponse<Company>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: QUERY_KEYS.companies.byId(companyId!),
    queryFn: () => companiesService.getCompanyById(companyId!),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    ...options,
  })
}

/**
 * Search companies by keyword
 */
export function useCompanySearch(
  query: CompanySearchQuery,
  options?: Omit<
    UseQueryOptions<AxiosResponse<CompanySearchResponse>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: QUERY_KEYS.companies.search(query.q),
    queryFn: () => companiesService.searchCompanies(query),
    enabled: !!query.q.trim(),
    staleTime: 1000 * 60 * 2, // Cache search results for 2 minutes
    ...options,
  })
}

/**
 * Get jobs for a specific company
 */
export function useCompanyJobs(
  companyId: number | null,
  skip: number = 0,
  limit: number = 20,
  options?: Omit<
    UseQueryOptions<AxiosResponse<CompanyJobsResponse>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  const paramsString = JSON.stringify({ skip, limit })
  
  return useQuery({
    queryKey: QUERY_KEYS.companies.jobs(companyId!, paramsString),
    queryFn: () => companiesService.getCompanyJobs(companyId!, skip, limit),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 3, // Cache for 3 minutes
    ...options,
  })
}

/**
 * Mutation Hooks (POST, PUT, DELETE operations)
 */

/**
 * Create a new company
 */
export function useCreateCompany(
  options?: UseMutationOptions<
    AxiosResponse<Company>,
    AxiosError,
    CreateCompanyMutationVars
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data }) => companiesService.createCompany(data),
    onSuccess: () => {
      // Invalidate all company lists to refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.companies.all })
    },
    ...options,
  })
}

/**
 * Update an existing company
 */
export function useUpdateCompany(
  options?: UseMutationOptions<
    AxiosResponse<Company>,
    AxiosError,
    UpdateCompanyMutationVars
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ companyId, data }) => companiesService.updateCompany(companyId, data),
    onSuccess: (data, variables) => {
      // Update the specific company in cache
      queryClient.setQueryData(QUERY_KEYS.companies.byId(variables.companyId), data)
      
      // Invalidate all company lists to refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.companies.all })
    },
    ...options,
  })
}

/**
 * Delete a company
 */
export function useDeleteCompany(
  options?: UseMutationOptions<
    AxiosResponse<DeleteCompanyResponse>,
    AxiosError,
    DeleteCompanyMutationVars
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ companyId }) => companiesService.deleteCompany(companyId),
    onSuccess: (_, variables) => {
      // Remove the company from cache
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.companies.byId(variables.companyId),
      })

      // Invalidate all company lists to refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.companies.all })
    },
    ...options,
  })
}
