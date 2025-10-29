// src/Modules/CandidateProfileAnalyzer/services/career.service.ts

import { apiClient } from '../../../shared/api/api-client'
import { ENDPOINTS } from '../../../shared/api/config'
import { AxiosResponse } from 'axios'
import {
  CareerAnalysisResponse,
  CareerHistoryItem,
  RoleListResponse,
  RoleDetailsResponse,
  AnalyzeFileRequest,
  AnalyzeTextRequest,
} from '../types/api.types'

/**
 * Career Recommendation Service
 * All API calls related to career recommendations and profile analysis
 */
class CareerService {
  /**
   * Analyze resume from file upload
   */
  async analyzeResumeFile(
    file: File,
    params?: AnalyzeFileRequest
  ): Promise<AxiosResponse<CareerAnalysisResponse>> {
    const formData: Record<string, any> = { file }

    if (params?.user_email) {
      formData.user_email = params.user_email
    }

    const queryParams = new URLSearchParams()
    if (params?.save_to_db !== undefined) {
      queryParams.append('save_to_db', String(params.save_to_db))
    }
    if (params?.top_n !== undefined) {
      queryParams.append('top_n', String(params.top_n))
    }

    const url = params && (params.save_to_db !== undefined || params.top_n !== undefined)
      ? `${ENDPOINTS.career.analyzeFile}?${queryParams.toString()}`
      : ENDPOINTS.career.analyzeFile

    return apiClient.uploadFormData<CareerAnalysisResponse>(url, formData, 'post')
  }

  /**
   * Analyze resume from text input
   */
  async analyzeResumeText(
    resumeText: string,
    params?: AnalyzeTextRequest
  ): Promise<AxiosResponse<CareerAnalysisResponse>> {
    const queryParams = new URLSearchParams()
    if (params?.save_to_db !== undefined) {
      queryParams.append('save_to_db', String(params.save_to_db))
    }
    if (params?.top_n !== undefined) {
      queryParams.append('top_n', String(params.top_n))
    }

    const url = params && (params.save_to_db !== undefined || params.top_n !== undefined)
      ? `${ENDPOINTS.career.analyzeText}?${queryParams.toString()}`
      : ENDPOINTS.career.analyzeText

    return apiClient.post<CareerAnalysisResponse>(url, {
      resume_text: resumeText,
      user_email: params?.user_email,
    })
  }

  /**
   * Get a specific analysis by ID
   */
  async getAnalysis(
    analysisId: number
  ): Promise<AxiosResponse<CareerAnalysisResponse>> {
    return apiClient.get<CareerAnalysisResponse>(
      ENDPOINTS.career.getAnalysis(analysisId)
    )
  }

  /**
   * Get analysis history for a user
   */
  async getAnalysisHistory(
    userEmail: string,
    limit: number = 10
  ): Promise<AxiosResponse<CareerHistoryItem[]>> {
    const queryParams = new URLSearchParams({
      user_email: userEmail,
      limit: String(limit),
    })

    return apiClient.get<CareerHistoryItem[]>(
      `${ENDPOINTS.career.getHistory}?${queryParams.toString()}`
    )
  }

  /**
   * Export analysis report
   */
  async exportAnalysis(
    analysisId: number,
    format: 'markdown' | 'json' | 'txt' = 'markdown'
  ): Promise<Blob> {
    const queryParams = new URLSearchParams({ format })

    const response = await apiClient.get<Blob>(
      `${ENDPOINTS.career.exportAnalysis(analysisId)}?${queryParams.toString()}`,
      {
        responseType: 'blob',
      }
    )

    return response.data
  }

  /**
   * Delete an analysis
   */
  async deleteAnalysis(
    analysisId: number
  ): Promise<AxiosResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(
      ENDPOINTS.career.deleteAnalysis(analysisId)
    )
  }

  /**
   * List all available roles
   */
  async listRoles(): Promise<AxiosResponse<RoleListResponse>> {
    return apiClient.get<RoleListResponse>(ENDPOINTS.career.listRoles)
  }

  /**
   * Get details for a specific role
   */
  async getRoleDetails(
    roleId: string
  ): Promise<AxiosResponse<RoleDetailsResponse>> {
    return apiClient.get<RoleDetailsResponse>(
      ENDPOINTS.career.getRoleDetails(roleId)
    )
  }
}

// Export singleton instance
export const careerService = new CareerService()
