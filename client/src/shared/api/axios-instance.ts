// src/shared/api/axios-instance.ts

import axios, { 
  AxiosInstance, 
  AxiosError, 
  InternalAxiosRequestConfig,
  AxiosResponse 
} from 'axios'
import { API_CONFIG } from './config'

// Token management utilities
const TokenManager = {
  getToken: (): string | null => {
    return localStorage.getItem('access_token') || localStorage.getItem('token')
  },
  
  setToken: (token: string): void => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('token', token) // Keep for backward compatibility
  },
  
  removeToken: (): void => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  },
  
  getRefreshToken: (): string | null => {
    return localStorage.getItem('refresh_token') || localStorage.getItem('refreshToken')
  },
}

// Create axios instance
const axiosInstance: AxiosInstance = axios.create(API_CONFIG)

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = TokenManager.getToken()
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
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

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log responses in development
    if (process.env.NODE_ENV === 'development') {
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
    
    // Log errors
    console.error('[API Response Error]', {
      status: error.response?.status,
      message: error.message,
      url: originalRequest?.url,
    })
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        // Attempt token refresh (if you have a refresh endpoint)
        // const refreshToken = TokenManager.getRefreshToken()
        // const response = await axios.post('/auth/refresh', { refreshToken })
        // TokenManager.setToken(response.data.token)
        // return axiosInstance(originalRequest)
        
        // For now, just clear token and redirect
        TokenManager.removeToken()
        
        // Redirect to login if in browser environment
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/signin'
        }
      } catch (refreshError) {
        TokenManager.removeToken()
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/signin'
        }
        return Promise.reject(refreshError)
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('[Network Error] No response received from server')
    }
    
    return Promise.reject(error)
  }
)

export default axiosInstance
export { TokenManager }
