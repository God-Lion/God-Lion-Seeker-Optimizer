/**
 * ⚠️ DEPRECATED - DO NOT USE
 * 
 * This file has been replaced by the new architecture:
 * - Types moved to: types/api.types.ts
 * - Service moved to: services/statistics.service.ts (now uses global apiClient)
 * - Hooks available in: hooks/useStatisticsQuery.ts & hooks/useStatisticsManagement.ts
 * 
 * Please use the new imports:
 * ```typescript
 * // Old (deprecated):
 * import { statisticsApiService } from './services/api'
 * 
 * // New (recommended):
 * import { statisticsService } from './services'
 * import { useStatisticsManagement } from './hooks'
 * ```
 * 
 * This file is kept for reference only and will be removed in future versions.
 * 
 * @deprecated Use services/statistics.service.ts and hooks/ instead
 * @see services/statistics.service.ts
 * @see hooks/useStatisticsQuery.ts
 * @see hooks/useStatisticsManagement.ts
 */

// Re-export from new location for backward compatibility (temporary)
export * from './../types/api.types'
export { statisticsService as statisticsApiService } from './statistics.service'

console.warn(
  '⚠️ DEPRECATION WARNING: You are importing from "services/api.ts" which is deprecated. ' +
  'Please update your imports to use "services/statistics.service.ts" and the new hooks.'
)
