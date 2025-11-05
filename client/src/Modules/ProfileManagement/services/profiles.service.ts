import { apiClient } from '../../../shared/api/api-client'
import { ENDPOINTS } from '../../../shared/api/config'
import { AxiosResponse } from 'axios'

export interface ResumeProfile {
  id: number
  user_id: number
  name: string
  resume_text: string
  file_path?: string
  parsed_skills: string[]
  experience_level: string
  education: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateProfileRequest {
  name: string
  resume_file?: File
  resume_text?: string
}

export interface UpdateProfileRequest {
  name?: string
  resume_text?: string
  is_active?: boolean
}

export interface UploadProfileResponse {
  message: string
  profile: ResumeProfile
}

export interface ProfileListResponse {
  profiles: ResumeProfile[]
  total: number
}

export interface ActiveProfileResponse {
  active_profile: ResumeProfile | null
}

class ProfilesService {
  async uploadProfile(file: File, name?: string): Promise<AxiosResponse<UploadProfileResponse>> {
    const formData = new FormData()
    formData.append('file', file)
    if (name) formData.append('name', name)

    return apiClient.uploadFormData<UploadProfileResponse>(
      ENDPOINTS.profiles.upload,
      formData,
      'post'
    )
  }

  async getProfiles(): Promise<AxiosResponse<ProfileListResponse>> {
    return apiClient.get<ProfileListResponse>(ENDPOINTS.profiles.list)
  }

  async getProfileById(profileId: number): Promise<AxiosResponse<ResumeProfile>> {
    return apiClient.get<ResumeProfile>(ENDPOINTS.profiles.byId(profileId))
  }

  async setActiveProfile(profileId: number): Promise<AxiosResponse<{ message: string }>> {
    return apiClient.put<{ message: string }>(ENDPOINTS.profiles.setActive(profileId), {})
  }

  async updateProfile(
    profileId: number,
    data: UpdateProfileRequest
  ): Promise<AxiosResponse<ResumeProfile>> {
    return apiClient.put<ResumeProfile>(ENDPOINTS.profiles.update(profileId), data)
  }

  async deleteProfile(profileId: number): Promise<AxiosResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(ENDPOINTS.profiles.delete(profileId))
  }

  async getActiveProfile(userId: number): Promise<AxiosResponse<ActiveProfileResponse>> {
    return apiClient.get<ActiveProfileResponse>(ENDPOINTS.profiles.activeStatus(userId))
  }
}

export const profilesService = new ProfilesService()
