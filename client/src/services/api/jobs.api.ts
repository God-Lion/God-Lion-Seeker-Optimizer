// src/services/api/jobs.api.ts
import { axiosInstance } from './axios-instance'
import {
  Job,
  JobApplication,
  JobApplicationPayload,
  JobMatches,
  JobSearch,
} from '@/types/job'

/**
 * Get a list of jobs with optional query parameters
 */
export const getJobs = async (
  query?: string,
  filters?: Record<string, any>,
) => {
  const response = await axiosInstance.get<{ jobs: Job[] }>('/jobs', {
    params: { query, ...filters },
  })
  return response.data.jobs
}

/**
 * Get details for a specific job
 */
export const getJobDetails = async (jobId: string) => {
  const response = await axiosInstance.get<Job>(`/jobs/${jobId}`)
  return response.data
}

/**
 * Search for jobs with advanced criteria
 */
export const searchJobs = async (searchParams: JobSearch) => {
  const response = await axiosInstance.post<{ jobs: Job[] }>(
    '/jobs/search',
    searchParams,
  )
  return response.data.jobs
}

/**
 * Get job matches for the current user
 */
export const getJobMatches = async () => {
  const response = await axiosInstance.get<JobMatches>('/jobs/matches')
  return response.data
}

/**
 * Apply for a job
 */
export const applyForJob = async (application: JobApplicationPayload) => {
  const response = await axiosInstance.post<JobApplication>(
    '/applications',
    application,
  )
  return response.data
}
