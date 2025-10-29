// src/Modules/CandidateProfileAnalyzer/hooks/index.ts

/**
 * Centralized exports for all Career Analyzer hooks
 */

// React Query hooks for API calls
export {
  useCareerAnalysis,
  useCareerHistory,
  useCareerRoles,
  useRoleDetails,
  useAnalyzeResumeFile,
  useAnalyzeResumeText,
  useExportAnalysis,
  useDeleteAnalysis,
} from './useCareerQuery'

// Business logic hooks
export { useProfileAnalyzer } from './useProfileAnalyzer'
export { useJobMatching } from './useJobMatching'
