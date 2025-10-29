/**
 * Route Guards Index
 * 
 * Exports all route guard components for easy importing.
 * These guards control access to different parts of the application
 * based on authentication status and user roles.
 */

export { default as GuestRoute } from './GuestRoute'
export { default as AuthRoute } from './AuthRoute'
export { default as AdminRoute } from './AdminRoute'

// Re-export for backwards compatibility
export { default as PrivateRoute } from './AuthRoute'
