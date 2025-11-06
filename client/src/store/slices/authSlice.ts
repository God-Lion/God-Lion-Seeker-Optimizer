import { StateCreator } from 'zustand'
import axios from 'axios'
import { IAuth, ILogin } from 'src/types'
import { IResponse } from 'src/types'
import axiosInstance from 'src/services/api/axios-instance'
import { API_CONFIG } from 'src/services/api/config'
import { secureTokenManager, TokenData as AuthTokens } from 'src/services/secureTokenManager'
import { AppStore } from 'src/store'

export type { AuthTokens }

export interface AuthSlice {
  user: IAuth | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  tokens: AuthTokens | null

  signIn: (credentials: ILogin) => Promise<void>
  signOut: (callback?: (status: number) => void) => Promise<void>
  refreshAuth: () => Promise<void>
  refreshToken: () => Promise<string>
  updateUser: (userData: Partial<IAuth>) => void
  setUser: (user: IAuth | null) => void
  setTokens: (tokens: AuthTokens | null) => void
  clearError: () => void
  setLoading: (loading: boolean) => void
}

export const createAuthSlice: StateCreator<
  AppStore,
  [['zustand/immer', never], ['zustand/persist', unknown]],
  [],
  AuthSlice
> = (set, get) => ({
  // Initial State
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  tokens: null,

  // Sign In
  signIn: async (credentials: ILogin) => {
    set((state) => {
      state.isLoading = true
      state.error = null
    })

    try {
      const response = await axios.post<IResponse>(
        `${API_CONFIG.baseURL}/signin`,
        credentials,
        { withCredentials: true }
      )

      if (response.status === 200 && response.data) {
        // Fetch user data after successful login
        await get().refreshAuth()
      }
    } catch (error: any) {
      set((state) => {
        state.isLoading = false
        state.error = error.response?.data?.message || 'Sign in failed'
        state.isAuthenticated = false
      })
      throw error
    }
  },

  // Sign Out
  signOut: async (callback?: (status: number) => void) => {
    try {
      const response = await axios.get(`${API_CONFIG.baseURL}/signout`, {
        withCredentials: true,
      })

      set((state) => {
        state.user = null
        state.isAuthenticated = false
        state.tokens = null
        state.error = null
      })

      secureTokenManager.clearTokens()

      if (callback) callback(response.status)
    } catch (error) {
      console.error('Sign out error:', error)
      set((state) => {
        state.user = null
        state.isAuthenticated = false
        state.tokens = null
      })

      secureTokenManager.clearTokens()
    } finally {
      set((state) => {
        state.isLoading = false
      })
    }
  },

  // Refresh Auth (check session and get user data)
  refreshAuth: async () => {
    set((state) => {
      state.isLoading = true
      state.error = null
    })

    try {
      // Use axiosInstance which has token refresh interceptors
      const response = await axiosInstance.get<IAuth>('/api/auth')

      if (response.status === 200 && response.data) {
        set((state) => {
          state.user = response.data
          state.isAuthenticated = true
          state.isLoading = false
          state.error = null
        })
      }
    } catch (error: any) {
      set((state) => {
        state.user = null
        state.isAuthenticated = false
        state.isLoading = false
        state.error = error.response?.data?.message || 'Session expired'
      })
    }
  },

  // Refresh Token (get new access token using refresh token)
  refreshToken: async () => {
    try {
      const tokens = secureTokenManager.getTokens()
      
      if (!tokens || !tokens.refreshToken) {
        throw new Error('No refresh token available')
      }

      interface RefreshResponse {
        access_token: string
        refresh_token: string
        expires_in: number
      }

      const response = await axios.post<RefreshResponse>(
        `${API_CONFIG.baseURL}/refresh-token`,
        { refresh_token: tokens.refreshToken },
        { withCredentials: true }
      )

      const { access_token, refresh_token, expires_in } = response.data
      const expiresAt = Date.now() + expires_in * 1000

      const newTokens: AuthTokens = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
      }

      secureTokenManager.setTokens(newTokens)
      
      set((state) => {
        state.tokens = newTokens
      })
      
      return access_token
    } catch (error: any) {
      set((state) => {
        state.user = null
        state.isAuthenticated = false
        state.tokens = null
        state.error = 'Token refresh failed'
      })
      secureTokenManager.clearTokens()
      throw error
    }
  },

  // Update User
  updateUser: (userData: Partial<IAuth>) => {
    set((state) => {
      if (state.user) {
        state.user = { ...state.user, ...userData }
      }
    })
  },

  // Set User (directly set user data, e.g., after login)
  setUser: (user: IAuth | null) => {
    set((state) => {
      state.user = user
      state.isAuthenticated = user !== null
      state.error = null
    })
  },

  // Clear Error
  clearError: () => {
    set((state) => {
      state.error = null
    })
  },

  // Set Tokens
  setTokens: (tokens: AuthTokens | null) => {
    set((state) => {
      state.tokens = tokens
    })
    
    if (tokens) {
      secureTokenManager.setTokens(tokens)
    } else {
      secureTokenManager.clearTokens()
    }
  },

  // Set Loading
  setLoading: (loading: boolean) => {
    set((state) => {
      state.isLoading = loading
    })
  },
})
