// Shared hooks index file
export * from './useApi'
export * from './useApiHooks'
export * from './useDebounce'
export * from './useSSE'
export { default as usePersistentForm } from './usePersistentForm'
export { useRouteState, useHasRouteState, useClearAllRouteStates, useRestoreRouteState } from './useRouteState'
export { default as useSignOut } from './useSignOut'
export { default as useTabSync } from './useTabSync'
export { default as useDeduplicatedRequest } from './useDeduplicatedRequest'
export { default as useOptimisticUpdate } from './useOptimisticUpdate'

// Re-export useObjectCookie from core/hooks
export { useObjectCookie } from '../../core/hooks/useObjectCookie'
