// src/Modules/Statistics/types/api.types.ts

/**
 * Statistics API Types
 * Type definitions for all statistics-related API requests and responses
 */

// ==================== Response Types ====================

export interface DashboardOverview {
  total_jobs: number
  total_companies: number
  total_sessions: number
  analyzed_jobs: number
  recent_jobs_7_days: number
  timestamp: string
}

export interface JobsByLocation {
  location: string
  count: number
}

export interface JobsByCompany {
  company: string
  count: number
}

export interface JobsByType {
  job_type: string
  count: number
}

export interface JobsByExperience {
  experience_level: string
  count: number
}

export interface ScrapingActivity {
  date: string
  sessions: number
  jobs_scraped: number
}

export interface TopSkill {
  skill: string
  count: number
}

export interface RecentJob {
  id: number
  title: string
  company_id: number
  location: string
  job_type: string
  experience_level: string
  posted_date?: string
  scraped_at?: string
  job_url: string
}

export interface SessionStatistics {
  total_sessions: number
  completed_sessions: number
  failed_sessions: number
  running_sessions: number
  average_jobs_per_session: number
  total_jobs_scraped: number
  success_rate: number
}

export interface JobTrends {
  period_days: number
  start_date: string
  end_date: string
  daily_jobs: Array<{
    date: string
    count: number
  }>
}

// ==================== Request Parameters ====================

export interface StatisticsQueryParams {
  limit?: number
  days?: number
}

export interface LocationStatsParams {
  limit?: number
}

export interface CompanyStatsParams {
  limit?: number
}

export interface ScrapingActivityParams {
  days?: number
}

export interface TopSkillsParams {
  limit?: number
}

export interface RecentJobsParams {
  limit?: number
}

export interface JobTrendsParams {
  days?: number
}

// ==================== Aggregated Response Types ====================

export interface StatisticsOverviewResponse {
  overview: DashboardOverview
  session_stats: SessionStatistics
}

export interface StatisticsChartsData {
  jobs_by_type: JobsByType[]
  jobs_by_experience: JobsByExperience[]
  jobs_by_company: JobsByCompany[]
  scraping_activity: ScrapingActivity[]
  job_trends: JobTrends
  top_skills: TopSkill[]
}
