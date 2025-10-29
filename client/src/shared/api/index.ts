// src/shared/api/index.ts

export { default as axiosInstance } from './axios-instance'
export { ApiClient, apiClient, handleApiError, isApiError } from './api-client'
export { API_CONFIG, ENDPOINTS, QUERY_KEYS } from './config'
export { TokenManager } from './axios-instance'

// Export all services
export * from './services/api.service'

// Export types
export type { ApiResponse, PaginatedResponse, ApiError } from './api-client'
