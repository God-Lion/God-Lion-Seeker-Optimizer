import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { baseUrl } from 'src/utils/api_link'

interface TokenData {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

interface RefreshResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

class TokenRefreshService {
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (token: string) => void
    reject: (error: any) => void
  }> = []

  private processQueue(error: any = null, token: string | null = null) {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error)
      } else if (token) {
        promise.resolve(token)
      }
    })

    this.failedQueue = []
  }

  private getStoredTokens(): TokenData | null {
    try {
      const stored = localStorage.getItem('auth-storage')
      if (!stored) return null

      const parsed = JSON.parse(stored)
      return parsed.state?.tokens || null
    } catch (error) {
      console.error('Error reading tokens:', error)
      return null
    }
  }

  private saveTokens(tokens: TokenData) {
    try {
      const stored = localStorage.getItem('auth-storage')
      if (stored) {
        const parsed = JSON.parse(stored)
        parsed.state.tokens = tokens
        localStorage.setItem('auth-storage', JSON.stringify(parsed))
      }
    } catch (error) {
      console.error('Error saving tokens:', error)
    }
  }

  private isTokenExpired(expiresAt: number): boolean {
    const now = Date.now()
    const bufferTime = 5 * 60 * 1000 // 5 minutes buffer
    return now >= expiresAt - bufferTime
  }

  async refreshToken(): Promise<string> {
    const tokens = this.getStoredTokens()
    
    if (!tokens || !tokens.refreshToken)
      throw new Error('No refresh token available')

    try {
      const response = await axios.post<RefreshResponse>(
        `${baseUrl()}refresh-token`,
        {
          refresh_token: tokens.refreshToken,
        },
        {
          withCredentials: true,
        }
      )

      const { access_token, refresh_token, expires_in } = response.data

      // Calculate expiration time
      const expiresAt = Date.now() + expires_in * 1000

      const newTokens: TokenData = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
      }

      this.saveTokens(newTokens)

      return access_token
    } catch (error) {
      console.error('Token refresh failed:', error)
      throw error
    }
  }

  /**
   * Setup axios interceptors for automatic token refresh
   */
  setupInterceptors(axiosInstance: AxiosInstance) {
    // Request interceptor - add token to requests
    axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const tokens = this.getStoredTokens()

        if (tokens) {
          // Check if token is expired
          if (this.isTokenExpired(tokens.expiresAt)) {
            // Token is expired, refresh it
            if (!this.isRefreshing) {
              this.isRefreshing = true

              try {
                const newToken = await this.refreshToken()
                this.isRefreshing = false
                this.processQueue(null, newToken)

                if (config.headers) config.headers.Authorization = `Bearer ${newToken}`

              } catch (error) {
                this.isRefreshing = false
                this.processQueue(error, null)
                throw error
              }
            } else {
              return new Promise((resolve, reject) => {
                this.failedQueue.push({
                  resolve: (token: string) => {
                    if (config.headers) {
                      config.headers.Authorization = `Bearer ${token}`
                    }
                    resolve(config)
                  },
                  reject: (error: any) => {
                    reject(error)
                  },
                })
              })
            }
          } else {
            // Token is still valid, add it to request
            if (config.headers && tokens.accessToken) config.headers.Authorization = `Bearer ${tokens.accessToken}`
          }
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor - handle 401 errors
    axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean
        }

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Token refresh in progress, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({
                resolve: async (token: string) => {
                  if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`
                  }
                  try {
                    const response = await axios(originalRequest)
                    resolve(response)
                  } catch (err) {
                    reject(err)
                  }
                },
                reject: (err: any) => {
                  reject(err)
                },
              })
            })
          }

          originalRequest._retry = true
          this.isRefreshing = true

          try {
            const newToken = await this.refreshToken()
            this.isRefreshing = false
            this.processQueue(null, newToken)

            // Retry original request with new token
            if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${newToken}`

            return axios(originalRequest)
          } catch (refreshError) {
            this.isRefreshing = false
            this.processQueue(refreshError, null)

            // Refresh failed, redirect to login
            this.handleRefreshFailure()

            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }


  private handleRefreshFailure() {
    localStorage.removeItem('auth-storage')
    sessionStorage.clear()

    // Redirect to login page
    if (window.location.pathname !== '/auth/login') window.location.href = '/auth/login'
  }

 
  async manualRefresh(): Promise<string> {
    if (this.isRefreshing) {
      // Wait for ongoing refresh
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject })
      })
    }

    this.isRefreshing = true

    try {
      const token = await this.refreshToken()
      this.isRefreshing = false
      this.processQueue(null, token)
      return token
    } catch (error) {
      this.isRefreshing = false
      this.processQueue(error, null)
      throw error
    }
  }

  isRefreshInProgress(): boolean {
    return this.isRefreshing
  }

  clearQueue() {
    this.failedQueue = []
    this.isRefreshing = false
  }
}

export const tokenRefreshService = new TokenRefreshService()

export default tokenRefreshService
