import { apiClient } from '../../../shared/api/api-client'
import { ENDPOINTS } from '../../../shared/api/config'
import { AxiosResponse } from 'axios'

export interface AutomationStartResponse {
  job_id: string
  status: string
  message: string
}

export interface AutomationStatus {
  is_running: boolean
  current_job?: string
  jobs_processed: number
  last_run?: string
}

export interface AutomationConfig {
  enabled: boolean
  schedule?: string
  job_filters?: {
    location?: string[]
    job_type?: string[]
    experience_level?: string[]
    min_match_score?: number
  }
  auto_apply: boolean
  notification_email?: string
}

export interface AutomationHistoryItem {
  id: number
  job_id: number
  job_title: string
  company: string
  status: 'success' | 'failed' | 'pending'
  applied_at: string
  error_message?: string
}

export interface AutomationStats {
  total_applications: number
  successful_applications: number
  failed_applications: number
  success_rate: number
  last_30_days: number
}

export const startAutomatedSubmission = async (
  jobId: number
): Promise<AutomationStartResponse> => {
  const response = await apiClient.post<AutomationStartResponse>(ENDPOINTS.automation.start, {
    jobId,
  })
  return response.data
}

export const getAutomationStatus = async (): Promise<AutomationStatus> => {
  const response = await apiClient.get<AutomationStatus>(ENDPOINTS.automation.status)
  return response.data
}

export const stopAutomation = async (): Promise<AxiosResponse<{ message: string }>> => {
  return apiClient.post<{ message: string }>(ENDPOINTS.automation.stop, {})
}

export const getAutomationConfig = async (): Promise<AxiosResponse<AutomationConfig>> => {
  return apiClient.get<AutomationConfig>(ENDPOINTS.automation.config)
}

export const updateAutomationConfig = async (
  config: Partial<AutomationConfig>
): Promise<AxiosResponse<AutomationConfig>> => {
  return apiClient.put<AutomationConfig>(ENDPOINTS.automation.updateConfig, config)
}

export const getAutomationHistory = async (params: {
  skip?: number
  limit?: number
}): Promise<AxiosResponse<{ items: AutomationHistoryItem[]; total: number }>> => {
  const searchParams = new URLSearchParams()
  if (params.skip !== undefined) searchParams.append('skip', String(params.skip))
  if (params.limit !== undefined) searchParams.append('limit', String(params.limit))

  const queryString = searchParams.toString()
  const url = queryString
    ? `${ENDPOINTS.automation.history}?${queryString}`
    : ENDPOINTS.automation.history

  return apiClient.get<{ items: AutomationHistoryItem[]; total: number }>(url)
}

export const getAutomationStats = async (): Promise<AxiosResponse<AutomationStats>> => {
  return apiClient.get<AutomationStats>(ENDPOINTS.automation.stats)
}

