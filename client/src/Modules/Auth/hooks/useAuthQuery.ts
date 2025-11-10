// src/Modules/Auth/hooks/useAuthQuery.ts - ENHANCED VERSION

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query'
import { AxiosError, AxiosResponse } from 'axios'
import { QUERY_KEYS } from 'src/services/api'
import { authService } from '../services/auth.service'
import Session from 'src/services/Session'
import { secureTokenManager } from 'src/services/secureTokenManager'
import {
  TokenResponse,
  MessageResponse,
  VerifyEmailResponse,
  SessionResponse,
  ProfileSettingsResponse,
  UpdateResponse,
  LoginMutationVars,
  RegisterMutationVars,
  ForgotPasswordMutationVars,
  ResetPasswordMutationVars,
  UpdateNamesMutationVars,
  UpdateEmailMutationVars,
  UpdatePhotoMutationVars,
  // New types
  ChangePasswordRequest,
  MfaSetupRequest,
  MfaSetupResponse,
  MfaVerifyRequest,
  MfaVerifyResponse,
  MfaStatusResponse,
  SessionsResponse,
  DeactivateAccountRequest,
  ReactivateAccountRequest,
  LoginHistoryResponse,
  LinkOAuthRequest,
  LinkedAccountsResponse,
} from '../types/api.types'

// ============================================================================
// EXISTING QUERY HOOKS (GET operations)
// ============================================================================

/**
 * Get current session
 */
export function useSession(
  options?: Omit<
    UseQueryOptions<AxiosResponse<SessionResponse>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: QUERY_KEYS.auth.session,
    queryFn: () => authService.getSession(),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: false, // Don't retry if unauthorized
    ...options,
  })
}

/**
 * Get profile settings
 */
export function useProfileSettings(
  options?: Omit<
    UseQueryOptions<AxiosResponse<ProfileSettingsResponse>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: QUERY_KEYS.auth.profileSettings,
    queryFn: () => authService.getProfileSettings(),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    ...options,
  })
}

// ============================================================================
// EXISTING MUTATION HOOKS (POST, PUT, DELETE operations)
// ============================================================================

/**
 * Login mutation
 */
export function useLogin(
  options?: UseMutationOptions<
    AxiosResponse<TokenResponse>,
    AxiosError,
    LoginMutationVars,
    unknown
  >
) {
  const queryClient = useQueryClient()
  
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: ({ data }) => authService.login(data),
    onSuccess: (...args) => {
      const [response] = args
      console.log('[useLogin] onSuccess triggered', { response, hasCustomCallback: !!customOnSuccess })
      
      if (response.data.token) {
        const expiresIn = response.data.expires_in || 3600
        const expiresAt = Date.now() + expiresIn * 1000
        
        secureTokenManager.setTokens({
          accessToken: response.data.token,
          refreshToken: response.data.refresh_token,
          expiresAt,
        })
        
        try {
          const session = new Session()
          session.write('user', response.data.user)
          console.log('[useLogin] User data stored in session')
        } catch (error) {
          console.warn('[useLogin] Failed to store in Session:', error)
        }
        
        console.log('[useLogin] Tokens stored securely in memory')
      }
      
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.session })
      
      console.log('[useLogin] Calling custom onSuccess callback')
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      customOnError?.(...args)
    },
    ...restOptions,
  })
}

/**
 * Register mutation
 */
export function useRegister(
  options?: UseMutationOptions<
    AxiosResponse<MessageResponse>,
    AxiosError,
    RegisterMutationVars,
    unknown
  >
) {
  return useMutation({
    mutationFn: ({ data }) => authService.register(data),
    ...options,
  })
}

/**
 * Logout mutation
 */
export function useLogout(
  options?: UseMutationOptions<
    AxiosResponse<MessageResponse>,
    AxiosError,
    void,
    unknown
  >
) {
  const queryClient = useQueryClient()
  
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: (...args) => {
      secureTokenManager.clearTokens()
      localStorage.removeItem('user')
      
      queryClient.clear()
      
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      customOnError?.(...args)
    },
    ...restOptions,
  })
}

/**
 * Verify email mutation
 */
export function useVerifyEmail(
  options?: UseMutationOptions<
    AxiosResponse<VerifyEmailResponse>,
    AxiosError,
    { token: string },
    unknown
  >
) {
  return useMutation({
    mutationFn: ({ token }) => authService.verifyEmail(token),
    ...options,
  })
}

/**
 * Forgot password mutation
 */
export function useForgotPassword(
  options?: UseMutationOptions<
    AxiosResponse<MessageResponse>,
    AxiosError,
    ForgotPasswordMutationVars,
    unknown
  >
) {
  return useMutation({
    mutationFn: ({ data }) => authService.forgotPassword(data),
    ...options,
  })
}

/**
 * Reset password mutation
 */
export function useResetPassword(
  options?: UseMutationOptions<
    AxiosResponse<MessageResponse>,
    AxiosError,
    ResetPasswordMutationVars,
    unknown
  >
) {
  return useMutation({
    mutationFn: ({ data }) => authService.resetPassword(data),
    ...options,
  })
}

/**
 * Refresh token mutation
 */
export function useRefreshToken(
  options?: UseMutationOptions<
    AxiosResponse<TokenResponse>,
    AxiosError,
    { refreshToken: string },
    unknown
  >
) {
  const queryClient = useQueryClient()
  
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: ({ refreshToken }) => authService.refreshToken(refreshToken),
    onSuccess: (...args) => {
      const [response] = args
      if (response.data.token) {
        const expiresIn = response.data.expires_in || 3600
        const expiresAt = Date.now() + expiresIn * 1000
        
        secureTokenManager.setTokens({
          accessToken: response.data.token,
          refreshToken: response.data.refresh_token,
          expiresAt,
        })
      }
      
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.session })
      
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      customOnError?.(...args)
    },
    ...restOptions,
  })
}

/**
 * Update names mutation
 */
export function useUpdateNames(
  options?: UseMutationOptions<
    AxiosResponse<UpdateResponse>,
    AxiosError,
    UpdateNamesMutationVars,
    unknown
  >
) {
  const queryClient = useQueryClient()
  
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: ({ data }) => authService.updateNames(data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.session })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.profileSettings })
      
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      customOnError?.(...args)
    },
    ...restOptions,
  })
}

/**
 * Update email mutation
 */
export function useUpdateEmail(
  options?: UseMutationOptions<
    AxiosResponse<UpdateResponse>,
    AxiosError,
    UpdateEmailMutationVars,
    unknown
  >
) {
  const queryClient = useQueryClient()
  
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: ({ data }) => authService.updateEmail(data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.session })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.profileSettings })
      
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      customOnError?.(...args)
    },
    ...restOptions,
  })
}

/**
 * Update photo mutation
 */
export function useUpdatePhoto(
  options?: UseMutationOptions<
    AxiosResponse<UpdateResponse>,
    AxiosError,
    UpdatePhotoMutationVars,
    unknown
  >
) {
  const queryClient = useQueryClient()
  
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: ({ data }) => authService.updatePhoto(data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.session })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.profileSettings })
      
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      customOnError?.(...args)
    },
    ...restOptions,
  })
}

// ============================================================================
// NEW HOOKS - Change Password (Critical)
// ============================================================================

/**
 * Change Password Hook
 */
export function useChangePassword(
  options?: UseMutationOptions<
    AxiosResponse<MessageResponse>,
    AxiosError,
    ChangePasswordRequest,
    unknown
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: (data) => authService.changePassword(data),
    onSuccess: (...args) => {
      // Clear tokens - force re-login for security
      secureTokenManager.clearTokens()
      queryClient.clear()
      
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      customOnError?.(...args)
    },
    ...restOptions,
  })
}

// ============================================================================
// NEW HOOKS - Multi-Factor Authentication
// ============================================================================

/**
 * Setup MFA
 */
export function useSetupMfa(
  options?: UseMutationOptions<
    AxiosResponse<MfaSetupResponse>,
    AxiosError,
    MfaSetupRequest,
    unknown
  >
) {
  return useMutation({
    mutationFn: (data) => authService.setupMfa(data),
    ...options,
  })
}

/**
 * Verify MFA
 */
export function useVerifyMfa(
  options?: UseMutationOptions<
    AxiosResponse<MfaVerifyResponse>,
    AxiosError,
    MfaVerifyRequest,
    unknown
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: (data) => authService.verifyMfa(data),
    onSuccess: (...args) => {
      const [response] = args
      const { token, refresh_token, expires_in } = response.data
      
      secureTokenManager.setTokens({
        accessToken: token,
        refreshToken: refresh_token,
        expiresAt: Date.now() + expires_in * 1000,
      })
      
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.session })
      queryClient.invalidateQueries({ queryKey: ['auth', 'mfa', 'status'] })
      
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      customOnError?.(...args)
    },
    ...restOptions,
  })
}

/**
 * Disable MFA
 */
export function useDisableMfa(
  options?: UseMutationOptions<
    AxiosResponse<MessageResponse>,
    AxiosError,
    void,
    unknown
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: () => authService.disableMfa(),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'mfa', 'status'] })
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      customOnError?.(...args)
    },
    ...restOptions,
  })
}

/**
 * Get MFA Status
 */
export function useMfaStatus(
  options?: Omit<
    UseQueryOptions<AxiosResponse<MfaStatusResponse>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: ['auth', 'mfa', 'status'],
    queryFn: () => authService.getMfaStatus(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    ...options,
  })
}

/**
 * Regenerate Backup Codes
 */
export function useRegenerateBackupCodes(
  options?: UseMutationOptions<
    AxiosResponse<{ backup_codes: string[] }>,
    AxiosError,
    void,
    unknown
  >
) {
  return useMutation({
    mutationFn: () => authService.regenerateBackupCodes(),
    ...options,
  })
}

// ============================================================================
// NEW HOOKS - Session Management
// ============================================================================

/**
 * Get All Sessions
 */
export function useSessions(
  options?: Omit<
    UseQueryOptions<AxiosResponse<SessionsResponse>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: () => authService.getSessions(),
    staleTime: 1000 * 60 * 1, // 1 minute
    ...options,
  })
}

/**
 * Revoke Session
 */
export function useRevokeSession(
  options?: UseMutationOptions<
    AxiosResponse<MessageResponse>,
    AxiosError,
    string,
    unknown
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: (sessionId) => authService.revokeSession(sessionId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] })
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      customOnError?.(...args)
    },
    ...restOptions,
  })
}

/**
 * Revoke All Sessions
 */
export function useRevokeAllSessions(
  options?: UseMutationOptions<
    AxiosResponse<MessageResponse>,
    AxiosError,
    void,
    unknown
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: () => authService.revokeAllSessions(),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] })
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      customOnError?.(...args)
    },
    ...restOptions,
  })
}

// ============================================================================
// NEW HOOKS - Account Management
// ============================================================================

/**
 * Deactivate Account
 */
export function useDeactivateAccount(
  options?: UseMutationOptions<
    AxiosResponse<MessageResponse>,
    AxiosError,
    DeactivateAccountRequest,
    unknown
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: (data) => authService.deactivateAccount(data),
    onSuccess: (...args) => {
      secureTokenManager.clearTokens()
      queryClient.clear()
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      customOnError?.(...args)
    },
    ...restOptions,
  })
}

/**
 * Reactivate Account
 */
export function useReactivateAccount(
  options?: UseMutationOptions<
    AxiosResponse<TokenResponse>,
    AxiosError,
    ReactivateAccountRequest,
    unknown
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: (data) => authService.reactivateAccount(data),
    onSuccess: (...args) => {
      const [response] = args
      const { token, refresh_token, expires_in } = response.data
      
      secureTokenManager.setTokens({
        accessToken: token,
        refreshToken: refresh_token,
        expiresAt: Date.now() + expires_in * 1000,
      })
      
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.session })
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      customOnError?.(...args)
    },
    ...restOptions,
  })
}

// ============================================================================
// NEW HOOKS - Login History
// ============================================================================

/**
 * Get Login History
 */
export function useLoginHistory(
  limit: number = 50,
  options?: Omit<
    UseQueryOptions<AxiosResponse<LoginHistoryResponse>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: ['auth', 'login-history', limit],
    queryFn: () => authService.getLoginHistory(limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  })
}

/**
 * Get Security Logs
 */
export function useSecurityLogs(
  params?: any,
  options?: Omit<
    UseQueryOptions<AxiosResponse<any>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: ['auth', 'security-logs', params],
    queryFn: () => authService.getSecurityLogs(params),
    staleTime: 1000 * 60 * 5,
    ...options,
  })
}

// ============================================================================
// NEW HOOKS - OAuth
// ============================================================================

/**
 * OAuth Login
 */
export function useOAuthLogin(
  options?: UseMutationOptions<
    AxiosResponse<TokenResponse>,
    AxiosError,
    { provider: 'google' | 'facebook'; code: string },
    unknown
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: ({ provider, code }) => authService.oauthLogin(provider, code),
    onSuccess: (...args) => {
      const [response] = args
      const { token, refresh_token, expires_in } = response.data
      
      secureTokenManager.setTokens({
        accessToken: token,
        refreshToken: refresh_token,
        expiresAt: Date.now() + expires_in * 1000,
      })
      
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.session })
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      customOnError?.(...args)
    },
    ...restOptions,
  })
}

/**
 * Link OAuth Provider
 */
export function useLinkOAuthProvider(
  options?: UseMutationOptions<
    AxiosResponse<MessageResponse>,
    AxiosError,
    LinkOAuthRequest,
    unknown
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: (data) => authService.linkOAuthProvider(data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'linked-accounts'] })
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      customOnError?.(...args)
    },
    ...restOptions,
  })
}

/**
 * Unlink OAuth Provider
 */
export function useUnlinkOAuthProvider(
  options?: UseMutationOptions<
    AxiosResponse<MessageResponse>,
    AxiosError,
    'google' | 'facebook',
    unknown
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: (provider) => authService.unlinkOAuthProvider(provider),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'linked-accounts'] })
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      customOnError?.(...args)
    },
    ...restOptions,
  })
}

/**
 * Get Linked Accounts
 */
export function useLinkedAccounts(
  options?: Omit<
    UseQueryOptions<AxiosResponse<LinkedAccountsResponse>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: ['auth', 'linked-accounts'],
    queryFn: () => authService.getLinkedAccounts(),
    staleTime: 1000 * 60 * 10,
    ...options,
  })
}

// ============================================================================
// NEW HOOKS - Email Preferences
// ============================================================================

/**
 * Get Email Preferences
 */
export function useEmailPreferences(
  options?: Omit<
    UseQueryOptions<AxiosResponse<any>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: ['auth', 'email-preferences'],
    queryFn: () => authService.getEmailPreferences(),
    staleTime: 1000 * 60 * 10,
    ...options,
  })
}

/**
 * Update Email Preferences
 */
export function useUpdateEmailPreferences(
  options?: UseMutationOptions<
    AxiosResponse<MessageResponse>,
    AxiosError,
    Record<string, boolean>,
    unknown
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: (preferences) => authService.updateEmailPreferences(preferences),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'email-preferences'] })
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      customOnError?.(...args)
    },
    ...restOptions,
  })
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { data: session } = useSession({ retry: false })
  return !!session?.data?.user
}

/**
 * Get current user
 */
export function useCurrentUser() {
  const { data: session, ...rest } = useSession()
  return {
    user: session?.data?.user,
    ...rest,
  }
}

/**
 * Check user role
 */
export function useHasRole(role: string): boolean {
  const { user } = useCurrentUser()
  return user?.role === role
}

/**
 * Check multiple roles
 */
export function useHasAnyRole(roles: string[]): boolean {
  const { user } = useCurrentUser()
  return roles.includes(user?.role || '')
}
