/**
 * Dashboard Module Entry Point
 * 
 * Exports all public APIs from the Dashboard module:
 * - Hooks for data fetching and state management
 * - Services for API operations
 * - Types for TypeScript support
 * - Screens for routing
 * - Routes component
 * 
 * Usage:
 * ```typescript
 * import { useDashboardManagement, DashboardRoutes } from 'src/Modules/Dashboard'
 * ```
 */

// ============================================================================
// Hooks
// ============================================================================
export * from './hooks'

// ============================================================================
// Services
// ============================================================================
export * from './services'

// ============================================================================
// Types
// ============================================================================
export * from './types'

// ============================================================================
// Screens
// ============================================================================
export * from './screens'

// ============================================================================
// Routes
// ============================================================================
export { default as DashboardRoutes } from './routes/routes'

// ============================================================================
// Components (if needed externally)
// ============================================================================
// export * from './components' // Uncomment if components need to be exposed
