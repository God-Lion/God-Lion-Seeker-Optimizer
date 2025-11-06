// src/Modules/Auth/types/index.ts

/**
 * Centralized exports for all Auth types
 */

export type {
  User,
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
  LoginMutationVars,
  RegisterMutationVars,
  ForgotPasswordMutationVars,
  ResetPasswordMutationVars,
  UpdateNamesMutationVars,
  UpdateEmailMutationVars,
  UpdatePhotoMutationVars,
} from './api.types'
