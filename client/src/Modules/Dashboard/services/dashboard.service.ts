/**
 * Dashboard Service
 * 
 * Handles all dashboard-related API operations:
 * - Fetching dashboard overview
 * - Fetching statistics
 * - Fetching recent applications
 * - Fetching job recommendations
 */

import { apiClient } from 'src/services/api/api-client'
import { ENDPOINTS } from 'src/services/api/config'
import { AxiosResponse } from 'axios'
import type {
  DashboardOverviewResponse,
  DashboardStatsResponse,
  RecentApplicationsResponse,
  JobRecommendationsResponse,
  RecentApplicationsParams,
  RecommendationsParams,
} from '../types'

class DashboardService {
  // ============================================================================
  // GET Operations
  // ============================================================================

  /**
   * Get complete dashboard overview
   * Includes stats, recent applications, recommendations, and activity
   * 
   * @returns Promise with dashboard overview data
   * @example
   * const response = await dashboardService.getOverview()
   * console.log(response.data.stats)
   */
  async getOverview(): Promise<AxiosResponse<DashboardOverviewResponse>> {
    return apiClient.get<DashboardOverviewResponse>(ENDPOINTS.dashboard.overview)
  }

  /**
   * Get dashboard statistics only
   * Lightweight endpoint for just the stats cards
   * 
   * @returns Promise with dashboard statistics
   * @example
   * const response = await dashboardService.getStats()
   * console.log(response.data.applications_count)
   */
  async getStats(): Promise<AxiosResponse<DashboardStatsResponse>> {
    return apiClient.get<DashboardStatsResponse>(ENDPOINTS.dashboard.stats)
  }

  /**
   * Get recent applications
   * 
   * @param params - Query parameters (limit)
   * @returns Promise with recent applications array
   * @example
   * const response = await dashboardService.getRecentApplications({ limit: 5 })
   * console.log(response.data)
   */
  async getRecentApplications(
    params?: RecentApplicationsParams
  ): Promise<AxiosResponse<RecentApplicationsResponse>> {
    const queryParams = new URLSearchParams()
    
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString())
    }

    const url = params 
      ? `${ENDPOINTS.dashboard.recentApplications}?${queryParams.toString()}`
      : ENDPOINTS.dashboard.recentApplications

    return apiClient.get<RecentApplicationsResponse>(url)
  }

  /**
   * Get job recommendations
   * 
   * @param params - Query parameters (limit)
   * @returns Promise with job recommendations array
   * @example
   * const response = await dashboardService.getRecommendations({ limit: 10 })
   * console.log(response.data)
   */
  async getRecommendations(
    params?: RecommendationsParams
  ): Promise<AxiosResponse<JobRecommendationsResponse>> {
    const queryParams = new URLSearchParams()
    
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString())
    }

    const url = params
      ? `${ENDPOINTS.dashboard.recommendations}?${queryParams.toString()}`
      : ENDPOINTS.dashboard.recommendations

    return apiClient.get<JobRecommendationsResponse>(url)
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Refresh all dashboard data
   * Convenience method to fetch all data at once
   * 
   * @param applicationsLimit - Limit for recent applications (default: 10)
   * @param recommendationsLimit - Limit for recommendations (default: 10)
   * @returns Promise with all dashboard data
   */
  async refreshAll(
    applicationsLimit: number = 10,
    recommendationsLimit: number = 10
  ): Promise<{
    overview: DashboardOverviewResponse
    stats: DashboardStatsResponse
    applications: RecentApplicationsResponse
    recommendations: JobRecommendationsResponse
  }> {
    const [overviewRes, statsRes, applicationsRes, recommendationsRes] = await Promise.all([
      this.getOverview(),
      this.getStats(),
      this.getRecentApplications({ limit: applicationsLimit }),
      this.getRecommendations({ limit: recommendationsLimit }),
    ])

    return {
      overview: overviewRes.data,
      stats: statsRes.data,
      applications: applicationsRes.data,
      recommendations: recommendationsRes.data,
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService()
