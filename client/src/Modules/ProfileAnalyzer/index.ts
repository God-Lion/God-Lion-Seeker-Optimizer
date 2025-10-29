// src/Modules/CandidateProfileAnalyzer/index.ts
//
// Central export point for the CandidateProfileAnalyzer module
// Use this for clean imports: import { useAnalyzeResumeFile } from '@/Modules/CandidateProfileAnalyzer'

// Export all hooks
export * from './hooks'

// Export all services
export * from './services'

// Export all types
export * from './types'

// Export commonly used components (if any)
// export * from './components'

// Re-export for convenience
export { careerService } from './services/career.service'
export {
  useAnalyzeResumeFile,
  useAnalyzeResumeText,
  useCareerAnalysis,
  useCareerHistory,
  useCareerRoles,
  useRoleDetails,
  useExportAnalysis,
  useDeleteAnalysis,
} from './hooks/useCareerQuery'

export { useProfileAnalyzer } from './hooks/useProfileAnalyzer'
export { useJobMatching } from './hooks/useJobMatching'
