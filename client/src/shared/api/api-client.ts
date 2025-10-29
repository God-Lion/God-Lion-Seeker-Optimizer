// src/shared/api/api-client.ts

import { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios'
import axiosInstance from './axios-instance'

// Response types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: number
  success: boolean
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
  skip?: number
  limit?: number
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  status: number
  code?: string
}

// API Client class
export class ApiClient {
  constructor(private instance: AxiosInstance = axiosInstance) {}

  /**
   * GET request
   */
  async get<T = any>(
    url: string, 
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config)
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config)
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, config)
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data, config)
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    url: string, 
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, config)
  }

  /**
   * Upload file(s) using FormData
   */
  async uploadFile<T = any>(
    url: string,
    files: File | File[],
    fieldName: string = 'file',
    additionalData?: Record<string, any>
  ): Promise<AxiosResponse<T>> {
    const formData = new FormData()
    
    // Handle single or multiple files
    if (Array.isArray(files)) {
      files.forEach(file => formData.append(fieldName, file))
    } else {
      formData.append(fieldName, files)
    }

    // Add additional data
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value)
        }
      })
    }

    return this.instance.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  /**
   * Upload any object as FormData
   */
  async uploadFormData<T = any>(
    url: string,
    data: Record<string, any>,
    method: 'post' | 'put' | 'patch' = 'post'
  ): Promise<AxiosResponse<T>> {
    const formData = new FormData()

    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (value instanceof File) {
          formData.append(key, value)
        } else if (Array.isArray(value)) {
          value.forEach(item => formData.append(key, item))
        } else {
          formData.append(key, String(value))
        }
      }
    })

    return this.instance[method]<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  /**
   * GET request with fallback data
   */
  async getWithFallback<T = any>(
    url: string, 
    fallbackData: T,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    try {
      return await this.instance.get<T>(url, config)
    } catch (error) {
      console.warn(`Failed to fetch ${url}, using fallback data`, error)
      return {
        data: fallbackData,
        status: 200,
        statusText: 'OK (Fallback)',
        headers: {},
        config: config as any,
      } as AxiosResponse<T>
    }
  }
}

/**
 * Error handler utility
 */
export function handleApiError(error: any): ApiError {
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data?.message || 'An error occurred',
      errors: error.response.data?.errors,
      status: error.response.status,
      code: error.response.data?.code,
    }
  }

  if (error.request) {
    // Request made but no response received
    return {
      message: 'No response from server. Please check your connection.',
      status: 0,
      code: 'NETWORK_ERROR',
    }
  }

  // Something else happened
  return {
    message: error.message || 'An unexpected error occurred',
    status: 0,
    code: 'UNKNOWN_ERROR',
  }
}

/**
 * Type guard for API errors
 */
export function isApiError(error: any): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'status' in error
  )
}

// Export singleton instance
export const apiClient = new ApiClient()
