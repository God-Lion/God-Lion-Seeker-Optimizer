// src/Modules/Auth/hooks/useAuthQuery.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query'
import { AxiosError, AxiosResponse } from 'axios'
import { QUERY_KEYS } from '../../../shared/api/config'
import { authService } from '../services/auth.service'
import Session from '../../../utils/Session'
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
} from '../types/api.types'

/**
 * Query Hooks (GET operations)
 */

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

/**
 * Mutation Hooks (POST, PUT, DELETE operations)
 */

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
  
  // Extract callbacks to avoid overwriting
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: ({ data }) => authService.login(data),
    onSuccess: (...args) => {
      const [response] = args
      console.log('[useLogin] onSuccess triggered', { response, hasCustomCallback: !!customOnSuccess })
      
      // Store token and user data
      if (response.data.token) {
        // Store tokens in localStorage
        localStorage.setItem('access_token', response.data.token)
        localStorage.setItem('refresh_token', response.data.refresh_token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        // Also store in sessionStorage for Session class compatibility
        try {
          const session = new Session()
          session.write('user', response.data.user)
          console.log('[useLogin] User data stored in session')
        } catch (error) {
          console.warn('[useLogin] Failed to store in Session:', error)
        }
        
        console.log('[useLogin] Tokens stored in localStorage')
      }
      
      // Invalidate and refetch session
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.session })
      
      // Call the custom onSuccess callback if provided
      console.log('[useLogin] Calling custom onSuccess callback')
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      // Call the custom onError callback if provided
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
  
  // Extract callbacks to avoid overwriting
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: (...args) => {
      // Clear tokens from storage
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      
      // Clear all queries
      queryClient.clear()
      
      // Call the custom onSuccess callback if provided
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      // Call the custom onError callback if provided
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
  
  // Extract callbacks to avoid overwriting
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: ({ refreshToken }) => authService.refreshToken(refreshToken),
    onSuccess: (...args) => {
      const [response] = args
      // Update tokens in storage
      if (response.data.token) {
        localStorage.setItem('access_token', response.data.token)
        localStorage.setItem('refresh_token', response.data.refresh_token)
      }
      
      // Invalidate session
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.session })
      
      // Call the custom onSuccess callback if provided
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      // Call the custom onError callback if provided
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
  
  // Extract callbacks to avoid overwriting
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: ({ data }) => authService.updateNames(data),
    onSuccess: (...args) => {
      // Invalidate session and profile settings
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.session })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.profileSettings })
      
      // Call the custom onSuccess callback if provided
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      // Call the custom onError callback if provided
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
  
  // Extract callbacks to avoid overwriting
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: ({ data }) => authService.updateEmail(data),
    onSuccess: (...args) => {
      // Invalidate session and profile settings
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.session })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.profileSettings })
      
      // Call the custom onSuccess callback if provided
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      // Call the custom onError callback if provided
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
  
  // Extract callbacks to avoid overwriting
  const { onSuccess: customOnSuccess, onError: customOnError, ...restOptions } = options || {}

  return useMutation({
    mutationFn: ({ data }) => authService.updatePhoto(data),
    onSuccess: (...args) => {
      // Invalidate session and profile settings
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.session })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.profileSettings })
      
      // Call the custom onSuccess callback if provided
      customOnSuccess?.(...args)
    },
    onError: (...args) => {
      // Call the custom onError callback if provided
      customOnError?.(...args)
    },
    ...restOptions,
  })
}
