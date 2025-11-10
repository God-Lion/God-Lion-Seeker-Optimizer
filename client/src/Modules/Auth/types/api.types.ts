// src/Modules/Auth/types/api.types.ts - ENHANCED VERSION

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
  mfa_enabled?: boolean
}

// ============================================================================
// Request Types - EXISTING
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
// Request Types - NEW
// ============================================================================

// Change Password
export interface ChangePasswordRequest {
  current_password: string
  new_password: string
  confirm_password: string
}

// MFA (Multi-Factor Authentication)
export interface MfaSetupRequest {
  method: 'totp' | 'sms' | 'email'
}

export interface MfaVerifyRequest {
  code: string
  remember_device?: boolean
}

// Account Deactivation
export interface DeactivateAccountRequest {
  password: string
  reason?: string
  feedback?: string
}

export interface ReactivateAccountRequest {
  email: string
  password: string
}

// OAuth
export interface OAuthLoginRequest {
  provider: 'google' | 'facebook'
  code: string
}

export interface LinkOAuthRequest {
  provider: 'google' | 'facebook'
  code: string
}

// ============================================================================
// Response Types - EXISTING
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
// Response Types - NEW
// ============================================================================

// MFA
export interface MfaSetupResponse {
  secret?: string
  qr_code_url?: string
  backup_codes: string[]
  method: string
}

export interface MfaVerifyResponse {
  token: string
  refresh_token: string
  user: User
  expires_in: number
}

export interface MfaStatusResponse {
  enabled: boolean
  method?: 'totp' | 'sms' | 'email'
  backup_codes_remaining?: number
}

// Session Management
export interface UserSession {
  id: string
  device_name: string
  device_type: 'mobile' | 'tablet' | 'desktop'
  browser: string
  ip_address: string
  location?: string
  last_activity: string
  current: boolean
  created_at: string
}

export interface SessionsResponse {
  sessions: UserSession[]
  current_session_id: string
}

// Login History
export interface LoginAttempt {
  id: string
  timestamp: string
  status: 'success' | 'failed' | 'blocked'
  ip_address: string
  location?: string
  device: string
  browser: string
  reason?: string
}

export interface LoginHistoryResponse {
  attempts: LoginAttempt[]
  total: number
}

// OAuth
export interface LinkedAccountsResponse {
  accounts: Array<{
    provider: 'google' | 'facebook'
    linked_at: string
    email?: string
  }>
}

// Email Preferences
export interface EmailPreferencesResponse {
  preferences: Record<string, boolean>
}

// ============================================================================
// Mutation Variables Types (for React Query) - EXISTING
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
