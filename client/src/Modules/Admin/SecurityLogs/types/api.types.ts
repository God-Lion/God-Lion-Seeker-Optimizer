// src/Modules/Auth/types/api.types.ts

/**
 * API Types for Auth Module
 * Defines all request and response types for the Auth API
 */

// ============================================================================
// Core Entity Types
// ============================================================================

export interface User {
  id: number
  email: string
  first_name?: string
  last_name?: string
  full_name?: string
  role?: string
  status?: string
  avatar?: string
  email_verified?: boolean
  last_login?: string
  last_activity?: string
  created_at?: string
  updated_at?: string
}

// ============================================================================
// Request Types
// ============================================================================

export interface LoginRequest {
  email: string
  password: string
  remember_me?: boolean
}

export interface RegisterRequest {
  email: string
  password: string
  first_name: string
  last_name: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  new_password: string
}

export interface TrackFailedLoginRequest {
  email: string
  ip: string
  location?: string
  user_agent?: string
}

export interface UpdateNamesRequest {
  firstname?: string
  lastname?: string
}

export interface UpdateEmailRequest {
  email: string
  password: string
}

export interface UpdatePhotoRequest {
  id: number
  photo: File
}

// ============================================================================
// Response Types
// ============================================================================

export interface TokenResponse {
  token: string
  refresh_token: string
  user: User
  expires_in: number
}

export interface MessageResponse {
  message: string
  success: boolean
}

export interface VerifyEmailResponse {
  message: string
  success: boolean
}

export interface SessionResponse {
  user: User
  session_expiry: string
}

export interface TrackFailedLoginResponse {
  attempts_remaining?: number
  locked: boolean
  lockout_duration?: number
  email_sent?: boolean
}

export interface ProfileSettingsResponse {
  user: User
  settings?: Record<string, any>
}

export interface UpdateResponse {
  message: string
  success: boolean
  user?: User
}

// ============================================================================
// Mutation Variables Types (for React Query)
// ============================================================================

export interface LoginMutationVars {
  data: LoginRequest
}

export interface RegisterMutationVars {
  data: RegisterRequest
}

export interface ForgotPasswordMutationVars {
  data: ForgotPasswordRequest
}

export interface ResetPasswordMutationVars {
  data: ResetPasswordRequest
}

export interface UpdateNamesMutationVars {
  data: UpdateNamesRequest
}

export interface UpdateEmailMutationVars {
  data: UpdateEmailRequest
}

export interface UpdatePhotoMutationVars {
  data: UpdatePhotoRequest
}
