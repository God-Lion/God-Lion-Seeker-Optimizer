// src/Modules/JobsManagement/hooks/useJobsQuery.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query'
import { AxiosError, AxiosResponse } from 'axios'
import { QUERY_KEYS } from '../../../shared/api/config'
import { jobsService } from '../services/jobs.service'
import {
  Job,
  JobSearchParams,
  JobSearchQuery,
  JobSearchResponse,
  DeleteJobResponse,
  CreateJobMutationVars,
  UpdateJobMutationVars,
  DeleteJobMutationVars,
  JobStatistics,
} from '../types/api.types'

/**
 * Query Hooks (GET operations)
 */

/**
 * Get all jobs with filters and pagination
 */
export function useJobs(
  params: JobSearchParams = {},
  options?: Omit<
    UseQueryOptions<AxiosResponse<JobSearchResponse>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  const paramsString = JSON.stringify(params)
  
  return useQuery({
    queryKey: QUERY_KEYS.jobs.list(paramsString),
    queryFn: () => jobsService.getJobs(params),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    ...options,
  })
}

/**
 * Get a specific job by ID
 */
export function useJob(
  jobId: number | null,
  options?: Omit<
    UseQueryOptions<AxiosResponse<Job>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: QUERY_KEYS.jobs.byId(jobId!),
    queryFn: () => jobsService.getJobById(jobId!),
    enabled: !!jobId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    ...options,
  })
}

/**
 * Search jobs by keyword
 */
export function useJobSearch(
  query: JobSearchQuery,
  options?: Omit<
    UseQueryOptions<AxiosResponse<JobSearchResponse>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: QUERY_KEYS.jobs.search(query.q),
    queryFn: () => jobsService.searchJobs(query),
    enabled: !!query.q.trim(),
    staleTime: 1000 * 60 * 2, // Cache search results for 2 minutes
    ...options,
  })
}

/**
 * Get job statistics
 */
export function useJobStatistics(
  options?: Omit<
    UseQueryOptions<AxiosResponse<JobStatistics>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: QUERY_KEYS.jobs.statistics,
    queryFn: () => jobsService.getStatistics(),
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    ...options,
  })
}

/**
 * Mutation Hooks (POST, PUT, DELETE operations)
 */

/**
 * Create a new job
 */
export function useCreateJob(
  options?: UseMutationOptions<
    AxiosResponse<Job>,
    AxiosError,
    CreateJobMutationVars
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data }) => jobsService.createJob(data),
    onSuccess: () => {
      // Invalidate all job lists to refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs.statistics })
    },
    ...options,
  })
}

/**
 * Update an existing job
 */
export function useUpdateJob(
  options?: UseMutationOptions<
    AxiosResponse<Job>,
    AxiosError,
    UpdateJobMutationVars
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ jobId, data }) => jobsService.updateJob(jobId, data),
    onSuccess: (data, variables) => {
      // Update the specific job in cache
      queryClient.setQueryData(QUERY_KEYS.jobs.byId(variables.jobId), data)
      
      // Invalidate all job lists to refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs.all })
    },
    ...options,
  })
}

/**
 * Delete a job
 */
export function useDeleteJob(
  options?: UseMutationOptions<
    AxiosResponse<DeleteJobResponse>,
    AxiosError,
    DeleteJobMutationVars
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ jobId }) => jobsService.deleteJob(jobId),
    onSuccess: (data, variables) => {
      // Remove the job from cache
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.jobs.byId(variables.jobId),
      })

      // Invalidate all job lists to refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs.statistics })
    },
    ...options,
  })
}

/**
 * Bulk delete jobs
 */
export function useBulkDeleteJobs(
  options?: UseMutationOptions<
    AxiosResponse<{ deleted_count: number }>,
    AxiosError,
    { jobIds: number[] }
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ jobIds }) => jobsService.bulkDeleteJobs(jobIds),
    onSuccess: (data, variables) => {
      // Remove deleted jobs from cache
      variables.jobIds.forEach((jobId) => {
        queryClient.removeQueries({
          queryKey: QUERY_KEYS.jobs.byId(jobId),
        })
      })

      // Invalidate all job lists to refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs.statistics })
    },
    ...options,
  })
}
