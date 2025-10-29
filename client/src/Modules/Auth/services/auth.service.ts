// src/Modules/Auth/services/auth.service.ts

import { apiClient } from '../../../shared/api/api-client'
import { ENDPOINTS } from '../../../shared/api/config'
import { AxiosResponse } from 'axios'
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  TrackFailedLoginRequest,
  UpdateNamesRequest,
  UpdateEmailRequest,
  UpdatePhotoRequest,
  TokenResponse,
  MessageResponse,
  VerifyEmailResponse,
  SessionResponse,
  TrackFailedLoginResponse,
  ProfileSettingsResponse,
  UpdateResponse,
} from '../types/api.types'

/**
 * Auth Service
 * All API calls related to authentication using the global apiClient
 */
class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AxiosResponse<MessageResponse>> {
    return apiClient.post<MessageResponse>(ENDPOINTS.auth.register, data)
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AxiosResponse<TokenResponse>> {
    return apiClient.post<TokenResponse>(ENDPOINTS.auth.login, data)
  }

  /**
   * Logout user
   */
  async logout(): Promise<AxiosResponse<MessageResponse>> {
    return apiClient.post<MessageResponse>(ENDPOINTS.auth.logout)
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<AxiosResponse<VerifyEmailResponse>> {
    return apiClient.get<VerifyEmailResponse>(ENDPOINTS.auth.verifyEmailToken(token))
  }

  /**
   * Forgot password - send reset email
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<AxiosResponse<MessageResponse>> {
    return apiClient.post<MessageResponse>(ENDPOINTS.auth.forgotPassword, data)
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<AxiosResponse<MessageResponse>> {
    return apiClient.post<MessageResponse>(ENDPOINTS.auth.resetPassword, data)
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AxiosResponse<TokenResponse>> {
    return apiClient.post<TokenResponse>(
      ENDPOINTS.auth.refresh,
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    )
  }

  /**
   * Get current session
   */
  async getSession(): Promise<AxiosResponse<SessionResponse>> {
    return apiClient.get<SessionResponse>(ENDPOINTS.auth.session)
  }

  /**
   * Track failed login attempt
   */
  async trackFailedLogin(
    data: TrackFailedLoginRequest
  ): Promise<AxiosResponse<TrackFailedLoginResponse>> {
    return apiClient.post<TrackFailedLoginResponse>(ENDPOINTS.auth.trackFailedLogin, data)
  }

  /**
   * Get profile settings
   */
  async getProfileSettings(): Promise<AxiosResponse<ProfileSettingsResponse>> {
    return apiClient.get<ProfileSettingsResponse>(ENDPOINTS.user.settings)
  }

  /**
   * Update user names
   */
  async updateNames(data: UpdateNamesRequest): Promise<AxiosResponse<UpdateResponse>> {
    return apiClient.put<UpdateResponse>(ENDPOINTS.user.updateNames, data)
  }

  /**
   * Update user email
   */
  async updateEmail(data: UpdateEmailRequest): Promise<AxiosResponse<UpdateResponse>> {
    return apiClient.put<UpdateResponse>(ENDPOINTS.user.updateEmail, data)
  }

  /**
   * Update user photo
   */
  async updatePhoto(data: UpdatePhotoRequest): Promise<AxiosResponse<UpdateResponse>> {
    return apiClient.uploadFormData<UpdateResponse>(
      ENDPOINTS.user.updatePhoto(data.id),
      { photo: data.photo },
      'patch'
    )
  }
}

// Export singleton instance
export const authService = new AuthService()
