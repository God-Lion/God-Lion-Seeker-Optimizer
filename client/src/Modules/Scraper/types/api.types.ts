// src/Modules/Scraper/types/api.types.ts

/**
 * Type definitions for Scraper API
 */

// Request types
export interface ScrapeRequest {
  query: string
  location?: string
  max_jobs?: number
  experience_level?: string
  job_type?: string
}

export interface StopSessionRequest {
  session_id: number
}

export interface SessionsQueryParams {
  skip?: number
  limit?: number
  status?: ScrapingStatus
}

// Response types
export interface ScrapeResponse {
  session_id: number
  status: string
  message: string
  query: string
  location: string
  max_jobs: number
  timestamp: string
}

export interface ScrapingSession {
  session_id: number
  query: string
  location: string
  status: ScrapingStatus
  jobs_found: number
  jobs_scraped: number
  started_at?: string
  completed_at?: string
  error_message?: string
}

export interface SessionsListResponse {
  sessions: ScrapingSession[]
  skip: number
  limit: number
  total: number
}

export interface SessionStatusResponse {
  session: ScrapingSession
}

export interface StopSessionResponse {
  session_id: number
  status: string
  message: string
  stopped_at: string
}

// Enums
export type ScrapingStatus = 'pending' | 'running' | 'completed' | 'failed' | 'stopped'

// Mutation variable types for React Query
export interface StartScrapingMutationVars {
  data: ScrapeRequest
}

export interface StopSessionMutationVars {
  session_id: number
}

export interface SessionsQueryVars {
  params?: SessionsQueryParams
}
