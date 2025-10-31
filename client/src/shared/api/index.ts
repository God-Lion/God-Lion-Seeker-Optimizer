// Shared API exports
export * from './api-client'
export * from './axios-instance'
export * from './config'
export * from './services/api.service'

// Query keys for react-query
export const QUERY_KEYS = {
  CATEGORIES: 'categories',
  CATEGORY: 'category',
  JOBS: 'jobs',
  JOB: 'job',
  USERS: 'users',
  USER: 'user',
  PROFILE: 'profile',
  PROFILES: 'profiles',
  STATISTICS: 'statistics',
  ANALYTICS: 'analytics',
} as const
