// src/Modules/JobsManagement/hooks/index.ts

/**
 * Centralized exports for all Jobs Management hooks
 */

// React Query hooks for API calls
export {
  useJobs,
  useJob,
  useJobSearch,
  useJobStatistics,
  useCreateJob,
  useUpdateJob,
  useDeleteJob,
  useBulkDeleteJobs,
} from './useJobsQuery'

// Business logic hook
export { useJobsManagement } from './useJobsManagement'
