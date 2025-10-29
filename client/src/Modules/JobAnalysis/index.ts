// src/Modules/JobAnalysis/index.ts

/**
 * JobAnalysis Module - Centralized Exports
 * 
 * This module handles job analysis and recommendations functionality
 */

// Services
export { jobAnalysisService } from './services'

// Hooks
export {
  useAnalysisStats,
  useRecommendedJobs,
  useJobAnalysis,
  useAllAnalyses,
  useCreateAnalysis,
  useUpdateAnalysis,
  useDeleteAnalysis,
  useBulkCreateAnalyses,
  useBulkDeleteAnalyses,
  useJobAnalysisManagement,
  JOB_ANALYSIS_QUERY_KEYS,
} from './hooks'

// Types
export type {
  JobAnalysis,
  AnalysisStats,
  RecommendedJob,
  CreateAnalysisRequest,
  UpdateAnalysisRequest,
  DeleteAnalysisResponse,
  JobAnalysisResponse,
  RecommendedJobsResponse,
  AnalysisStatsResponse,
  RecommendedJobsParams,
  AnalysisFilterParams,
} from './types'

// Screens
export { default as JobAnalysisScreen } from './screens/JobAnalysis'
