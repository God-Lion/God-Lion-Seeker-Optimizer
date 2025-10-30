import { StateCreator } from 'zustand'
import axios from 'axios'
import { baseUrl } from 'src/lib/api'
import { IAuth, ILogin } from 'src/lib/types'
import { IResponse } from 'src/lib/types'
import axiosInstance from 'src/lib/api'
import { tokenRefreshService } from 'src/services/tokenRefresh.service'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

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
  AuthSlice,
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
        `${baseUrl()}signin`,
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
      const response = await axios.get(`${baseUrl()}signout`, {
        withCredentials: true,
      })

      set((state) => {
        state.user = null
        state.isAuthenticated = false
        state.tokens = null
        state.error = null
      })

      if (callback) callback(response.status)
    } catch (error) {
      console.error('Sign out error:', error)
      // Clear state anyway
      set((state) => {
        state.user = null
        state.isAuthenticated = false
        state.tokens = null
      })
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
      const newToken = await tokenRefreshService.manualRefresh()
      
      // Update tokens in state
      const tokens = tokenRefreshService['getStoredTokens']()
      if (tokens) {
        set((state) => {
          state.tokens = tokens
        })
      }
      
      return newToken
    } catch (error: any) {
      set((state) => {
        state.user = null
        state.isAuthenticated = false
        state.tokens = null
        state.error = 'Token refresh failed'
      })
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
  },

  // Set Loading
  setLoading: (loading: boolean) => {
    set((state) => {
      state.isLoading = loading
    })
  },
})
