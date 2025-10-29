// src/Modules/JobAnalysis/types/api.types.ts

/**
 * Job Analysis Types
 * All TypeScript interfaces and types for the Job Analysis module
 */

export interface JobAnalysis {
  job_id: number
  match_score: number
  skills_match: number
  experience_match: number
  education_match: number
  analysis_date?: string
  recommended: boolean
}

export interface AnalysisStats {
  total_analyses: number
  recommended_analyses: number
  average_match_score: number
  high_match_count: number
  recommendation_rate: number
  timestamp: string
}

export interface RecommendedJob {
  id: number
  title: string
  company_name: string
  location: string
  job_type: string
  experience_level: string
  posted_date?: string
  job_url: string
  match_score: number
  analysis: JobAnalysis
}

export interface CreateAnalysisRequest {
  job_id: number
  match_score: number
  skills_match: number
  experience_match: number
  education_match: number
  recommended: boolean
}

export interface UpdateAnalysisRequest {
  match_score?: number
  skills_match?: number
  experience_match?: number
  education_match?: number
  recommended?: boolean
}

export interface DeleteAnalysisResponse {
  success: boolean
  message: string
  deleted_job_id: number
}

export interface JobAnalysisResponse {
  data: JobAnalysis
  message?: string
}

export interface RecommendedJobsResponse {
  data: RecommendedJob[]
  total: number
  limit: number
}

export interface AnalysisStatsResponse {
  data: AnalysisStats
}

export interface RecommendedJobsParams {
  limit?: number
  skip?: number
  min_match_score?: number
}

export interface AnalysisFilterParams {
  recommended?: boolean
  min_match_score?: number
  max_match_score?: number
  skip?: number
  limit?: number
}
