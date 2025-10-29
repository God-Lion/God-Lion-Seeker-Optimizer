// Export all admin components, hooks, and types
export { default as AdminRoutes } from './routes/routes';

// Dashboard exports
export { default as AdminDashboard } from './Dashboard/screens/AdminDashboard';
export * from './Dashboard/components';
export * from './Dashboard/hooks';

// User Management exports
export { default as UserManagement } from './UserManagement/screens/UserManagement';
export * from './UserManagement/hooks';

// Content Moderation exports
export { default as ContentModeration } from './ContentModeration/screens/ContentModeration';

// Security Logs exports
export { default as SecurityLogs } from './SecurityLogs/screens/SecurityLogs';

// Analytics exports
export { default as Analytics } from './Analytics/screens/Analytics';

// Types exports
export * from './types';

// Admin service
export { default as adminService } from './Dashboard/services/admin.service';
