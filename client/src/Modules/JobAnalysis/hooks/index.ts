// src/Modules/JobAnalysis/hooks/index.ts

/**
 * Centralized exports for all Job Analysis hooks
 */

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
  JOB_ANALYSIS_QUERY_KEYS,
} from './useJobAnalysisQuery'

export { useJobAnalysisManagement } from './useJobAnalysisManagement'
