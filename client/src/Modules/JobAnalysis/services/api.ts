/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * 
 * The JobAnalysis module has been refactored to use the global apiClient
 * and follow the same architectural pattern as JobsManagement.
 * 
 * Please use the new imports instead:
 * 
 * OLD:
 * import { jobAnalysisApiService } from './services/api'
 * 
 * NEW:
 * import { jobAnalysisService } from '@/Modules/JobAnalysis'
 * 
 * Or:
 * import { jobAnalysisService } from './services/jobAnalysis.service'
 * 
 * All types have been moved to './types/api.types.ts'
 * All hooks are available in './hooks/'
 * 
 * See REFACTORING_DOCUMENTATION.md for migration guide.
 */

// Re-export from new location for backward compatibility
export { jobAnalysisService as jobAnalysisApiService } from './jobAnalysis.service'
export type {
  JobAnalysis,
  AnalysisStats,
  RecommendedJob,
  CreateAnalysisRequest,
} from '../types/api.types'

// Show deprecation warning in console
if (typeof window !== 'undefined') {
  console.warn(
    '[DEPRECATED] JobAnalysis api.ts is deprecated. ' +
    'Please import from "@/Modules/JobAnalysis" or use the new service structure. ' +
    'See REFACTORING_DOCUMENTATION.md for details.'
  )
}
