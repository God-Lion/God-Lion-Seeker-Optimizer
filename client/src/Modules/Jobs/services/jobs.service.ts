// src/Modules/JobsManagement/services/jobs.service.ts

import { apiClient } from '../../../shared/api/api-client'
import { ENDPOINTS } from '../../../shared/api/config'
import { AxiosResponse } from 'axios'
import {
  Job,
  JobSearchParams,
  JobSearchQuery,
  JobSearchResponse,
  CreateJobRequest,
  UpdateJobRequest,
  DeleteJobResponse,
  JobStatistics,
} from '../types/api.types'

/**
 * Jobs Service
 * All API calls related to job management using the global apiClient
 */
class JobsService {
  /**
   * Get all jobs with optional filters and pagination
   */
  async getJobs(params: JobSearchParams = {}): Promise<AxiosResponse<JobSearchResponse>> {
    const searchParams = new URLSearchParams()

    if (params.skip !== undefined) searchParams.append('skip', String(params.skip))
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit))
    if (params.company) searchParams.append('company', params.company)
    if (params.location) searchParams.append('location', params.location)
    if (params.job_type) searchParams.append('job_type', params.job_type)
    if (params.experience_level) searchParams.append('experience_level', params.experience_level)

    const queryString = searchParams.toString()
    const url = queryString ? `${ENDPOINTS.jobs.list}?${queryString}` : ENDPOINTS.jobs.list

    return apiClient.get<JobSearchResponse>(url)
  }

  /**
   * Get a specific job by ID
   */
  async getJobById(jobId: number): Promise<AxiosResponse<Job>> {
    return apiClient.get<Job>(ENDPOINTS.jobs.byId(jobId))
  }

  /**
   * Search jobs by keyword
   */
  async searchJobs(query: JobSearchQuery): Promise<AxiosResponse<JobSearchResponse>> {
    const searchParams = new URLSearchParams()
    searchParams.append('q', query.q)
    
    if (query.skip !== undefined) searchParams.append('skip', String(query.skip))
    if (query.limit !== undefined) searchParams.append('limit', String(query.limit))

    return apiClient.get<JobSearchResponse>(`${ENDPOINTS.jobs.search}?${searchParams.toString()}`)
  }

  /**
   * Create a new job
   */
  async createJob(data: CreateJobRequest): Promise<AxiosResponse<Job>> {
    return apiClient.post<Job>(ENDPOINTS.jobs.create, data)
  }

  /**
   * Update an existing job
   */
  async updateJob(jobId: number, data: UpdateJobRequest): Promise<AxiosResponse<Job>> {
    return apiClient.put<Job>(ENDPOINTS.jobs.update(jobId), data)
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId: number): Promise<AxiosResponse<DeleteJobResponse>> {
    return apiClient.delete<DeleteJobResponse>(ENDPOINTS.jobs.delete(jobId))
  }

  /**
   * Get job statistics
   */
  async getStatistics(): Promise<AxiosResponse<JobStatistics>> {
    return apiClient.get<JobStatistics>(ENDPOINTS.jobs.statistics)
  }

  /**
   * Bulk delete jobs
   */
  async bulkDeleteJobs(jobIds: number[]): Promise<AxiosResponse<{ deleted_count: number }>> {
    return apiClient.post<{ deleted_count: number }>(`${ENDPOINTS.jobs.list}/bulk-delete`, {
      job_ids: jobIds,
    })
  }

  /**
   * Get jobs with fallback data (for offline mode)
   */
  async getJobsWithFallback(
    params: JobSearchParams = {},
    fallbackData: JobSearchResponse
  ): Promise<AxiosResponse<JobSearchResponse>> {
    const searchParams = new URLSearchParams()

    if (params.skip !== undefined) searchParams.append('skip', String(params.skip))
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit))
    if (params.company) searchParams.append('company', params.company)
    if (params.location) searchParams.append('location', params.location)

    const queryString = searchParams.toString()
    const url = queryString ? `${ENDPOINTS.jobs.list}?${queryString}` : ENDPOINTS.jobs.list

    return apiClient.getWithFallback<JobSearchResponse>(url, fallbackData)
  }
}

// Export singleton instance
export const jobsService = new JobsService()
