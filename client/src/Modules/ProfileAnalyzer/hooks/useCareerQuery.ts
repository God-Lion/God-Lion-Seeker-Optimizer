// src/Modules/CandidateProfileAnalyzer/hooks/useCareerQuery.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions
} from '@tanstack/react-query'
import { AxiosError, AxiosResponse } from 'axios'
import { QUERY_KEYS } from '../../../shared/api/config'
import { careerService } from '../services/career.service'
import {
  CareerAnalysisResponse,
  CareerHistoryItem,
  RoleListResponse,
  RoleDetailsResponse,
  AnalyzeFileMutationVars,
  AnalyzeTextMutationVars,
  ExportAnalysisMutationVars,
  DeleteAnalysisMutationVars,
} from '../types/api.types'

/**
 * Query Hooks
 */

/**
 * Get a specific career analysis by ID
 */
export function useCareerAnalysis(
  analysisId: number,
  options?: Omit<
    UseQueryOptions<AxiosResponse<CareerAnalysisResponse>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: QUERY_KEYS.career.analysis(analysisId),
    queryFn: () => careerService.getAnalysis(analysisId),
    enabled: !!analysisId,
    ...options,
  })
}

/**
 * Get analysis history for a user
 */
export function useCareerHistory(
  userEmail: string,
  limit: number = 10,
  options?: Omit<
    UseQueryOptions<AxiosResponse<CareerHistoryItem[]>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: QUERY_KEYS.career.history(userEmail),
    queryFn: () => careerService.getAnalysisHistory(userEmail, limit),
    enabled: !!userEmail,
    ...options,
  })
}

/**
 * List all available career roles
 */
export function useCareerRoles(
  options?: Omit<
    UseQueryOptions<AxiosResponse<RoleListResponse>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: QUERY_KEYS.career.roles,
    queryFn: () => careerService.listRoles(),
    staleTime: 1000 * 60 * 30, // Roles don't change often, cache for 30 minutes
    ...options,
  })
}

/**
 * Get details for a specific role
 */
export function useRoleDetails(
  roleId: string,
  options?: Omit<
    UseQueryOptions<AxiosResponse<RoleDetailsResponse>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: QUERY_KEYS.career.roleDetails(roleId),
    queryFn: () => careerService.getRoleDetails(roleId),
    enabled: !!roleId,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    ...options,
  })
}

/**
 * Mutation Hooks
 */

/**
 * Analyze resume from file upload
 */
export function useAnalyzeResumeFile(
  options?: UseMutationOptions<
    AxiosResponse<CareerAnalysisResponse>,
    AxiosError,
    AnalyzeFileMutationVars
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, params }) =>
      careerService.analyzeResumeFile(file, params),
    onSuccess: (data, variables) => {
      // Invalidate history if user email is provided
      if (variables.params?.user_email) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.career.history(variables.params.user_email),
        })
      }

      // If analysis was saved, add to cache
      if (data.data.analysis_id) {
        queryClient.setQueryData(
          QUERY_KEYS.career.analysis(data.data.analysis_id),
          data
        )
      }
    },
    ...options,
  })
}

/**
 * Analyze resume from text input
 */
export function useAnalyzeResumeText(
  options?: UseMutationOptions<
    AxiosResponse<CareerAnalysisResponse>,
    AxiosError,
    AnalyzeTextMutationVars
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ resumeText, params }) =>
      careerService.analyzeResumeText(resumeText, params),
    onSuccess: (data, variables) => {
      // Invalidate history if user email is provided
      if (variables.params?.user_email) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.career.history(variables.params.user_email),
        })
      }

      // If analysis was saved, add to cache
      if (data.data.analysis_id) {
        queryClient.setQueryData(
          QUERY_KEYS.career.analysis(data.data.analysis_id),
          data
        )
      }
    },
    ...options,
  })
}

/**
 * Export analysis report
 */
export function useExportAnalysis(
  options?: UseMutationOptions<
    Blob,
    AxiosError,
    ExportAnalysisMutationVars
  >
) {
  return useMutation({
    mutationFn: ({ analysisId, format }) =>
      careerService.exportAnalysis(analysisId, format),
    onSuccess: (blob, variables) => {
      // Automatically download the file
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `career_analysis_${variables.analysisId}.${variables.format || 'md'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
    ...options,
  })
}

/**
 * Delete an analysis
 */
export function useDeleteAnalysis(
  options?: UseMutationOptions<
    AxiosResponse<{ message: string }>,
    AxiosError,
    DeleteAnalysisMutationVars
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ analysisId }) =>
      careerService.deleteAnalysis(analysisId),
    onSuccess: (data, variables) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.career.analysis(variables.analysisId),
      })

      // Invalidate all history queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.career.all,
      })
    },
    ...options,
  })
}
