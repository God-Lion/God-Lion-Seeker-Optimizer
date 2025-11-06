// src/Modules/Auth/index.ts

/**
 * Auth Module - Centralized exports
 * 
 * This module provides authentication functionality including:
 * - Login/Logout
 * - Registration
 * - Password reset
 * - Email verification
 * - Profile management
 */

// Export types
export type {
  User,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  TokenResponse,
  MessageResponse,
  SessionResponse,
  ProfileSettingsResponse,
} from './types'

// Export services
export { authService } from './services'

// Export hooks
export {
  useSession,
  useProfileSettings,
  useLogin,
  useRegister,
  useLogout,
  useVerifyEmail,
  useForgotPassword,
  useResetPassword,
  useRefreshToken,
  useUpdateNames,
  useUpdateEmail,
  useUpdatePhoto,
} from './hooks'
