import { apiClient } from '../../../shared/api/api-client'
import { ENDPOINTS } from '../../../shared/api/config'
import { AxiosResponse } from 'axios'

export interface DashboardStats {
  total_applications: number
  pending_applications: number
  interviews_scheduled: number
  total_saved_jobs: number
  profile_completion: number
  active_searches: number
}

export interface RecentApplication {
  id: number
  job_id: number
  job_title: string
  company: string
  status: string
  applied_at: string
  updated_at: string
}

export interface JobRecommendation {
  id: number
  job_id: number
  title: string
  company: string
  location: string
  match_score: number
  salary_range?: string
  posted_date: string
}

export interface DashboardOverview {
  stats: DashboardStats
  recent_applications: RecentApplication[]
  recommendations: JobRecommendation[]
  recent_activity: ActivityItem[]
}

export interface ActivityItem {
  id: number
  type: 'application' | 'interview' | 'saved_job' | 'profile_update'
  title: string
  description: string
  timestamp: string
}

class DashboardService {
  async getOverview(): Promise<AxiosResponse<DashboardOverview>> {
    return apiClient.get<DashboardOverview>(ENDPOINTS.dashboard.overview)
  }

  async getStats(): Promise<AxiosResponse<DashboardStats>> {
    return apiClient.get<DashboardStats>(ENDPOINTS.dashboard.stats)
  }

  async getRecentApplications(limit: number = 10): Promise<AxiosResponse<RecentApplication[]>> {
    return apiClient.get<RecentApplication[]>(
      `${ENDPOINTS.dashboard.recentApplications}?limit=${limit}`
    )
  }

  async getRecommendations(limit: number = 10): Promise<AxiosResponse<JobRecommendation[]>> {
    return apiClient.get<JobRecommendation[]>(
      `${ENDPOINTS.dashboard.recommendations}?limit=${limit}`
    )
  }
}

export const dashboardService = new DashboardService()
