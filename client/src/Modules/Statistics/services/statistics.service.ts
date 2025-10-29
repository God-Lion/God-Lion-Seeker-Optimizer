// src/Modules/Statistics/services/statistics.service.ts

import { apiClient } from '../../../shared/api/api-client'
import { AxiosResponse } from 'axios'
import {
  DashboardOverview,
  JobsByLocation,
  JobsByCompany,
  JobsByType,
  JobsByExperience,
  ScrapingActivity,
  TopSkill,
  RecentJob,
  SessionStatistics,
  JobTrends,
  LocationStatsParams,
  CompanyStatsParams,
  ScrapingActivityParams,
  TopSkillsParams,
  RecentJobsParams,
  JobTrendsParams,
} from '../types/api.types'

/**
 * Statistics Service
 * All API calls related to statistics and analytics using the global apiClient
 */
class StatisticsService {
  private readonly baseEndpoint = '/api/statistics'

  /**
   * Fallback data for offline/error scenarios
   */
  private getFallbackData<T>(endpoint: string): T {
    const fallbackMap: Record<string, any> = {
      overview: {
        total_jobs: 0,
        total_companies: 0,
        total_sessions: 0,
        analyzed_jobs: 0,
        recent_jobs_7_days: 0,
        timestamp: new Date().toISOString(),
      },
      'session-statistics': {
        total_sessions: 0,
        completed_sessions: 0,
        failed_sessions: 0,
        running_sessions: 0,
        average_jobs_per_session: 0,
        total_jobs_scraped: 0,
        success_rate: 0,
      },
      trends: {
        period_days: 30,
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString(),
        daily_jobs: [],
      },
    }

    return (fallbackMap[endpoint] || []) as T
  }

  /**
   * Get dashboard overview statistics
   */
  async getDashboardOverview(): Promise<AxiosResponse<DashboardOverview>> {
    try {
      return await apiClient.get<DashboardOverview>(`${this.baseEndpoint}/overview`)
    } catch (error) {
      console.warn('Failed to fetch dashboard overview, using fallback data', error)
      return {
        data: this.getFallbackData<DashboardOverview>('overview'),
        status: 200,
        statusText: 'OK (Fallback)',
        headers: {},
        config: {} as any,
      } as AxiosResponse<DashboardOverview>
    }
  }

  /**
   * Get job distribution by location
   */
  async getJobsByLocation(params: LocationStatsParams = {}): Promise<AxiosResponse<JobsByLocation[]>> {
    const searchParams = new URLSearchParams()
    if (params.limit) searchParams.append('limit', String(params.limit))

    const url = `${this.baseEndpoint}/jobs-by-location${searchParams.toString() ? `?${searchParams}` : ''}`
    
    try {
      return await apiClient.get<JobsByLocation[]>(url)
    } catch (error) {
      return apiClient.getWithFallback<JobsByLocation[]>(url, [])
    }
  }

  /**
   * Get job distribution by company
   */
  async getJobsByCompany(params: CompanyStatsParams = {}): Promise<AxiosResponse<JobsByCompany[]>> {
    const searchParams = new URLSearchParams()
    if (params.limit) searchParams.append('limit', String(params.limit))

    const url = `${this.baseEndpoint}/jobs-by-company${searchParams.toString() ? `?${searchParams}` : ''}`
    
    try {
      return await apiClient.get<JobsByCompany[]>(url)
    } catch (error) {
      return apiClient.getWithFallback<JobsByCompany[]>(url, [])
    }
  }

  /**
   * Get job distribution by type
   */
  async getJobsByType(): Promise<AxiosResponse<JobsByType[]>> {
    const url = `${this.baseEndpoint}/jobs-by-type`
    
    try {
      return await apiClient.get<JobsByType[]>(url)
    } catch (error) {
      return apiClient.getWithFallback<JobsByType[]>(url, [])
    }
  }

  /**
   * Get job distribution by experience level
   */
  async getJobsByExperience(): Promise<AxiosResponse<JobsByExperience[]>> {
    const url = `${this.baseEndpoint}/jobs-by-experience`
    
    try {
      return await apiClient.get<JobsByExperience[]>(url)
    } catch (error) {
      return apiClient.getWithFallback<JobsByExperience[]>(url, [])
    }
  }

  /**
   * Get scraping activity over time
   */
  async getScrapingActivity(params: ScrapingActivityParams = {}): Promise<AxiosResponse<ScrapingActivity[]>> {
    const searchParams = new URLSearchParams()
    if (params.days) searchParams.append('days', String(params.days))

    const url = `${this.baseEndpoint}/scraping-activity${searchParams.toString() ? `?${searchParams}` : ''}`
    
    try {
      return await apiClient.get<ScrapingActivity[]>(url)
    } catch (error) {
      return apiClient.getWithFallback<ScrapingActivity[]>(url, [])
    }
  }

  /**
   * Get top skills from job descriptions
   */
  async getTopSkills(params: TopSkillsParams = {}): Promise<AxiosResponse<TopSkill[]>> {
    const searchParams = new URLSearchParams()
    if (params.limit) searchParams.append('limit', String(params.limit))

    const url = `${this.baseEndpoint}/top-skills${searchParams.toString() ? `?${searchParams}` : ''}`
    
    try {
      return await apiClient.get<TopSkill[]>(url)
    } catch (error) {
      return apiClient.getWithFallback<TopSkill[]>(url, [])
    }
  }

  /**
   * Get recent jobs
   */
  async getRecentJobs(params: RecentJobsParams = {}): Promise<AxiosResponse<RecentJob[]>> {
    const searchParams = new URLSearchParams()
    if (params.limit) searchParams.append('limit', String(params.limit))

    const url = `${this.baseEndpoint}/recent-jobs${searchParams.toString() ? `?${searchParams}` : ''}`
    
    try {
      return await apiClient.get<RecentJob[]>(url)
    } catch (error) {
      return apiClient.getWithFallback<RecentJob[]>(url, [])
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStatistics(): Promise<AxiosResponse<SessionStatistics>> {
    try {
      return await apiClient.get<SessionStatistics>(`${this.baseEndpoint}/session-statistics`)
    } catch (error) {
      console.warn('Failed to fetch session statistics, using fallback data', error)
      return {
        data: this.getFallbackData<SessionStatistics>('session-statistics'),
        status: 200,
        statusText: 'OK (Fallback)',
        headers: {},
        config: {} as any,
      } as AxiosResponse<SessionStatistics>
    }
  }

  /**
   * Get job trends over time
   */
  async getJobTrends(params: JobTrendsParams = {}): Promise<AxiosResponse<JobTrends>> {
    const searchParams = new URLSearchParams()
    if (params.days) searchParams.append('days', String(params.days))

    const url = `${this.baseEndpoint}/trends${searchParams.toString() ? `?${searchParams}` : ''}`
    
    try {
      return await apiClient.get<JobTrends>(url)
    } catch (error) {
      console.warn('Failed to fetch job trends, using fallback data', error)
      return {
        data: this.getFallbackData<JobTrends>('trends'),
        status: 200,
        statusText: 'OK (Fallback)',
        headers: {},
        config: {} as any,
      } as AxiosResponse<JobTrends>
    }
  }
}

// Export singleton instance
export const statisticsService = new StatisticsService()
