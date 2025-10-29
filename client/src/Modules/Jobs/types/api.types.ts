// src/Modules/JobsManagement/types/api.types.ts

/**
 * API Types for Jobs Management Module
 * Defines all request and response types for the Jobs API
 */

// ============================================================================
// Core Entity Types
// ============================================================================

export interface Job {
  id: number
  title: string
  company_name: string
  company_id?: number
  location: string
  job_type: string
  experience_level: string
  salary_range?: string
  description: string
  requirements?: string
  posted_date?: string
  job_url: string
  external_id?: string
  scraped_at?: string
  created_at?: string
  updated_at?: string
}

// ============================================================================
// Request Types
// ============================================================================

export interface JobSearchParams {
  skip?: number
  limit?: number
  company?: string
  location?: string
  job_type?: string
  experience_level?: string
}

export interface JobSearchQuery {
  q: string
  skip?: number
  limit?: number
}

export interface CreateJobRequest {
  title: string
  company_name: string
  company_id?: number
  location: string
  job_type: string
  experience_level: string
  salary_range?: string
  description: string
  requirements?: string
  job_url: string
  external_id?: string
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  id: number
}

// ============================================================================
// Response Types
// ============================================================================

export interface JobSearchResponse {
  jobs: Job[]
  skip: number
  limit: number
  total: number
}

export interface JobDetailResponse {
  job: Job
}

export interface DeleteJobResponse {
  message: string
  deleted_id: number
}

// ============================================================================
// Mutation Variables Types (for React Query)
// ============================================================================

export interface DeleteJobMutationVars {
  jobId: number
}

export interface CreateJobMutationVars {
  data: CreateJobRequest
}

export interface UpdateJobMutationVars {
  jobId: number
  data: UpdateJobRequest
}

// ============================================================================
// Filter and Sort Types
// ============================================================================

export interface JobFilters {
  company?: string
  location?: string
  job_type?: string
  experience_level?: string
  salary_min?: number
  salary_max?: number
  posted_after?: string
}

export type JobSortField = 'title' | 'company_name' | 'posted_date' | 'created_at'
export type SortDirection = 'asc' | 'desc'

export interface JobSortOptions {
  field: JobSortField
  direction: SortDirection
}

// ============================================================================
// Statistics Types
// ============================================================================

export interface JobStatistics {
  total_jobs: number
  total_companies: number
  jobs_by_type: Record<string, number>
  jobs_by_experience: Record<string, number>
  jobs_by_location: Record<string, number>
  recent_jobs_count: number
}
