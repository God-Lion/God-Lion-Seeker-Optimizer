// src/Modules/JobAnalysis/hooks/useJobAnalysisQuery.ts

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { jobAnalysisService } from '../services'
import {
  JobAnalysis,
  AnalysisStats,
  RecommendedJob,
  CreateAnalysisRequest,
  UpdateAnalysisRequest,
  RecommendedJobsParams,
  AnalysisFilterParams,
} from '../types'
import { handleApiError } from '../../../shared/api/api-client'

/**
 * Query Keys for Job Analysis
 */
export const JOB_ANALYSIS_QUERY_KEYS = {
  all: ['jobAnalysis'] as const,
  stats: ['jobAnalysis', 'stats'] as const,
  recommended: (params: string) => ['jobAnalysis', 'recommended', params] as const,
  byJobId: (jobId: number) => ['jobAnalysis', 'job', jobId] as const,
  list: (params: string) => ['jobAnalysis', 'list', params] as const,
}

/**
 * Hook to fetch analysis stats
 */
export const useAnalysisStats = (options?: Omit<UseQueryOptions<AnalysisStats>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: JOB_ANALYSIS_QUERY_KEYS.stats,
    queryFn: async () => {
      const response = await jobAnalysisService.getAnalysisStats()
      return response.data
    },
    ...options,
  })
}

/**
 * Hook to fetch recommended jobs
 */
export const useRecommendedJobs = (
  params: RecommendedJobsParams = {},
  options?: Omit<UseQueryOptions<{ data: RecommendedJob[]; total: number }>, 'queryKey' | 'queryFn'>
) => {
  const paramsKey = JSON.stringify(params)

  return useQuery({
    queryKey: JOB_ANALYSIS_QUERY_KEYS.recommended(paramsKey),
    queryFn: async () => {
      const response = await jobAnalysisService.getRecommendedJobs(params)
      return response.data
    },
    ...options,
  })
}

/**
 * Hook to fetch analysis for a specific job
 */
export const useJobAnalysis = (
  jobId: number | null,
  options?: Omit<UseQueryOptions<JobAnalysis>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: jobId ? JOB_ANALYSIS_QUERY_KEYS.byJobId(jobId) : ['jobAnalysis', 'null'],
    queryFn: async () => {
      if (!jobId) throw new Error('Job ID is required')
      const response = await jobAnalysisService.getJobAnalysis(jobId)
      return response.data
    },
    enabled: !!jobId,
    ...options,
  })
}

/**
 * Hook to fetch all analyses with filters
 */
export const useAllAnalyses = (
  params: AnalysisFilterParams = {},
  options?: Omit<UseQueryOptions<{ data: JobAnalysis[]; total: number }>, 'queryKey' | 'queryFn'>
) => {
  const paramsKey = JSON.stringify(params)

  return useQuery({
    queryKey: JOB_ANALYSIS_QUERY_KEYS.list(paramsKey),
    queryFn: async () => {
      const response = await jobAnalysisService.getAllAnalyses(params)
      return response.data
    },
    ...options,
  })
}

/**
 * Hook to create a new analysis
 */
export const useCreateAnalysis = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateAnalysisRequest) => {
      const response = await jobAnalysisService.createAnalysis(data)
      return response.data
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: JOB_ANALYSIS_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: JOB_ANALYSIS_QUERY_KEYS.stats })
      queryClient.invalidateQueries({
        queryKey: JOB_ANALYSIS_QUERY_KEYS.byJobId(data.job_id),
      })
    },
    onError: (error) => {
      console.error('Failed to create analysis:', handleApiError(error))
    },
  })
}

/**
 * Hook to update an existing analysis
 */
export const useUpdateAnalysis = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ jobId, data }: { jobId: number; data: UpdateAnalysisRequest }) => {
      const response = await jobAnalysisService.updateAnalysis(jobId, data)
      return response.data
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: JOB_ANALYSIS_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: JOB_ANALYSIS_QUERY_KEYS.stats })
      queryClient.invalidateQueries({
        queryKey: JOB_ANALYSIS_QUERY_KEYS.byJobId(data.job_id),
      })
    },
    onError: (error) => {
      console.error('Failed to update analysis:', handleApiError(error))
    },
  })
}

/**
 * Hook to delete an analysis
 */
export const useDeleteAnalysis = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ jobId }: { jobId: number }) => {
      const response = await jobAnalysisService.deleteAnalysis(jobId)
      return response.data
    },
    onSuccess: () => {
      // Invalidate all queries as we don't know which specific ones to invalidate
      queryClient.invalidateQueries({ queryKey: JOB_ANALYSIS_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: JOB_ANALYSIS_QUERY_KEYS.stats })
    },
    onError: (error) => {
      console.error('Failed to delete analysis:', handleApiError(error))
    },
  })
}

/**
 * Hook to bulk create analyses
 */
export const useBulkCreateAnalyses = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (analyses: CreateAnalysisRequest[]) => {
      const response = await jobAnalysisService.bulkCreateAnalyses(analyses)
      return response.data
    },
    onSuccess: () => {
      // Invalidate all queries
      queryClient.invalidateQueries({ queryKey: JOB_ANALYSIS_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: JOB_ANALYSIS_QUERY_KEYS.stats })
    },
    onError: (error) => {
      console.error('Failed to bulk create analyses:', handleApiError(error))
    },
  })
}

/**
 * Hook to bulk delete analyses
 */
export const useBulkDeleteAnalyses = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (jobIds: number[]) => {
      const response = await jobAnalysisService.bulkDeleteAnalyses(jobIds)
      return response.data
    },
    onSuccess: () => {
      // Invalidate all queries
      queryClient.invalidateQueries({ queryKey: JOB_ANALYSIS_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: JOB_ANALYSIS_QUERY_KEYS.stats })
    },
    onError: (error) => {
      console.error('Failed to bulk delete analyses:', handleApiError(error))
    },
  })
}
