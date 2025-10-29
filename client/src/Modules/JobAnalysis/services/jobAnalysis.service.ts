// src/Modules/JobAnalysis/services/jobAnalysis.service.ts

import { apiClient } from '../../../shared/api/api-client'
import { AxiosResponse } from 'axios'
import {
  JobAnalysis,
  AnalysisStats,
  RecommendedJob,
  CreateAnalysisRequest,
  UpdateAnalysisRequest,
  DeleteAnalysisResponse,
  RecommendedJobsParams,
  AnalysisFilterParams,
} from '../types/api.types'

/**
 * Job Analysis Service
 * All API calls related to job analysis using the global apiClient
 */
class JobAnalysisService {
  private readonly baseUrl = '/api/analysis'

  /**
   * Get analysis for a specific job
   */
  async getJobAnalysis(jobId: number): Promise<AxiosResponse<JobAnalysis>> {
    return apiClient.get<JobAnalysis>(`/api/jobs/${jobId}/analysis`)
  }

  /**
   * Get statistics about job analyses
   */
  async getAnalysisStats(): Promise<AxiosResponse<AnalysisStats>> {
    return apiClient.get<AnalysisStats>(`${this.baseUrl}/stats`)
  }

  /**
   * Get recommended jobs based on analysis
   */
  async getRecommendedJobs(
    params: RecommendedJobsParams = {}
  ): Promise<AxiosResponse<{ data: RecommendedJob[]; total: number }>> {
    const searchParams = new URLSearchParams()

    if (params.limit !== undefined) searchParams.append('limit', String(params.limit))
    if (params.skip !== undefined) searchParams.append('skip', String(params.skip))
    if (params.min_match_score !== undefined) {
      searchParams.append('min_match_score', String(params.min_match_score))
    }

    const queryString = searchParams.toString()
    const url = queryString
      ? `${this.baseUrl}/recommended?${queryString}`
      : `${this.baseUrl}/recommended`

    return apiClient.get<{ data: RecommendedJob[]; total: number }>(url)
  }

  /**
   * Create a new job analysis
   */
  async createAnalysis(data: CreateAnalysisRequest): Promise<AxiosResponse<JobAnalysis>> {
    return apiClient.post<JobAnalysis>(`${this.baseUrl}`, data)
  }

  /**
   * Update an existing job analysis
   */
  async updateAnalysis(
    jobId: number,
    data: UpdateAnalysisRequest
  ): Promise<AxiosResponse<JobAnalysis>> {
    return apiClient.put<JobAnalysis>(`${this.baseUrl}/${jobId}`, data)
  }

  /**
   * Delete a job analysis
   */
  async deleteAnalysis(jobId: number): Promise<AxiosResponse<DeleteAnalysisResponse>> {
    return apiClient.delete<DeleteAnalysisResponse>(`${this.baseUrl}/${jobId}`)
  }

  /**
   * Get all analyses with optional filters
   */
  async getAllAnalyses(
    params: AnalysisFilterParams = {}
  ): Promise<AxiosResponse<{ data: JobAnalysis[]; total: number }>> {
    const searchParams = new URLSearchParams()

    if (params.recommended !== undefined) {
      searchParams.append('recommended', String(params.recommended))
    }
    if (params.min_match_score !== undefined) {
      searchParams.append('min_match_score', String(params.min_match_score))
    }
    if (params.max_match_score !== undefined) {
      searchParams.append('max_match_score', String(params.max_match_score))
    }
    if (params.skip !== undefined) searchParams.append('skip', String(params.skip))
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit))

    const queryString = searchParams.toString()
    const url = queryString ? `${this.baseUrl}?${queryString}` : `${this.baseUrl}`

    return apiClient.get<{ data: JobAnalysis[]; total: number }>(url)
  }

  /**
   * Bulk create analyses
   */
  async bulkCreateAnalyses(
    analyses: CreateAnalysisRequest[]
  ): Promise<AxiosResponse<{ created_count: number; analyses: JobAnalysis[] }>> {
    return apiClient.post<{ created_count: number; analyses: JobAnalysis[] }>(
      `${this.baseUrl}/bulk`,
      analyses
    )
  }

  /**
   * Bulk delete analyses
   */
  async bulkDeleteAnalyses(
    jobIds: number[]
  ): Promise<AxiosResponse<{ deleted_count: number }>> {
    return apiClient.post<{ deleted_count: number }>(`${this.baseUrl}/bulk-delete`,
      jobIds
    )
  }

  /**
   * Get recommended jobs with fallback data (for offline mode)
   */
  async getRecommendedJobsWithFallback(
    params: RecommendedJobsParams = {},
    fallbackData: { data: RecommendedJob[]; total: number }
  ): Promise<AxiosResponse<{ data: RecommendedJob[]; total: number }>> {
    const searchParams = new URLSearchParams()

    if (params.limit !== undefined) searchParams.append('limit', String(params.limit))
    if (params.skip !== undefined) searchParams.append('skip', String(params.skip))
    if (params.min_match_score !== undefined) {
      searchParams.append('min_match_score', String(params.min_match_score))
    }

    const queryString = searchParams.toString()
    const url = queryString
      ? `${this.baseUrl}/recommended?${queryString}`
      : `${this.baseUrl}/recommended`

    return apiClient.getWithFallback<{ data: RecommendedJob[]; total: number }>(url, fallbackData)
  }
}

// Export singleton instance
export const jobAnalysisService = new JobAnalysisService()
