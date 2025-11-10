import axios, { 
  AxiosInstance, 
  AxiosError, 
  InternalAxiosRequestConfig,
  AxiosResponse 
} from 'axios'
import { API_CONFIG } from './config'
import { secureTokenManager, TokenData } from './../secureTokenManager'

interface RefreshResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

class TokenRefreshManager {
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

  private async refreshToken(): Promise<string> {
    const tokens = secureTokenManager.getTokens()
    
    if (!tokens || !tokens.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await axios.post<RefreshResponse>(
        `${API_CONFIG.baseURL}/refresh-token`,
        { refresh_token: tokens.refreshToken },
        { withCredentials: true }
      )

      const { access_token, refresh_token, expires_in } = response.data
      const expiresAt = Date.now() + expires_in * 1000

      const newTokens: TokenData = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
      }

      secureTokenManager.setTokens(newTokens)
      return access_token
    } catch (error) {
      console.error('Token refresh failed:', error)
      throw error
    }
  }

  private handleRefreshFailure() {
    secureTokenManager.clearTokens()
    localStorage.removeItem('god-lion-seeker-optimizer-storage')
    sessionStorage.clear()

    if (window.location.pathname !== '/auth/login') {
      window.location.href = '/auth/login'
    }
  }

  async attemptRefresh(): Promise<string> {
    if (this.isRefreshing) {
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
      this.handleRefreshFailure()
      throw error
    }
  }

  isRefreshInProgress(): boolean {
    return this.isRefreshing
  }

  queueRequest(resolve: (token: string) => void, reject: (error: any) => void) {
    this.failedQueue.push({ resolve, reject })
  }
}

const refreshManager = new TokenRefreshManager()

const axiosInstance: AxiosInstance = axios.create(API_CONFIG)

// Request interceptor - add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = secureTokenManager.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = secureTokenManager.getRefreshToken()
        
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        // Call refresh endpoint
        const { data } = await axios.post(
          `${API_CONFIG.baseURL}/api/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        )

        // Update tokens
        secureTokenManager.setTokens({
          accessToken: data.token,
          refreshToken: data.refresh_token,
          expiresAt: Date.now() + data.expires_in * 1000,
        })

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.token}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        // Refresh failed, logout user
        secureTokenManager.clearTokens()
        window.location.href = '/auth/signin'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const tokens = secureTokenManager.getTokens()

    if (tokens) {
      if (secureTokenManager.isTokenExpired()) {
        if (!refreshManager.isRefreshInProgress()) {
          try {
            const newToken = await refreshManager.attemptRefresh()
            if (config.headers) {
              config.headers.Authorization = `Bearer ${newToken}`
            }
          } catch (error) {
            return Promise.reject(error)
          }
        } else {
          const token = await new Promise<string>((resolve, reject) => {
            refreshManager.queueRequest(resolve, reject)
          })
          if (config.headers) {
            config.headers.Authorization = `Bearer ${token}`
          }
        }
      } else {
        if (config.headers && tokens.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`
        }
      }
    }

    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      })
    }

    return config
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      })
    }
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { 
      _retry?: boolean 
    }

    console.error('[API Response Error]', {
      status: error.response?.status,
      message: error.message,
      url: originalRequest?.url,
    })

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (refreshManager.isRefreshInProgress()) {
        return new Promise((resolve, reject) => {
          refreshManager.queueRequest(
            async (token: string) => {
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
            (err: any) => {
              reject(err)
            }
          )
        })
      }

      originalRequest._retry = true

      try {
        const newToken = await refreshManager.attemptRefresh()
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
        }
        return axios(originalRequest)
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
    }

    if (!error.response) {
      console.error('[Network Error] No response received from server')
    }

    return Promise.reject(error)
  }
)

// Export both default and named export for compatibility
export default axiosInstance
export { axiosInstance }
