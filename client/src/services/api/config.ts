// src/shared/api/config.ts

const getBaseURL = (): string => {
  const envApiUrl = import.meta.env.VITE_API_URL
  const isDev = import.meta.env.DEV
  const isProd = import.meta.env.PROD
  
  if (isDev && !envApiUrl) {
    return ''
  }
  
  if (!envApiUrl) {
    console.warn('VITE_API_URL not configured')
    return 'http://localhost:8000'
  }
  
  if (isProd && !envApiUrl.startsWith('https://')) {
    console.error('❌ CRITICAL: Production API must use HTTPS!')
    throw new Error('Production API must use HTTPS protocol')
  }
  
  return envApiUrl
}

export const API_CONFIG = {
  baseURL: getBaseURL(),
  timeout: import.meta.env.VITE_API_TIMEOUT ? Number(import.meta.env.VITE_API_TIMEOUT) : 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
} as const

export const ENDPOINTS = {
  // Health & Metrics
  health: {
    root: '/',
    basic: '/api/health',
    live: '/api/health/live',
    ready: '/api/health/ready',
    detailed: '/api/health/detailed',
    startup: '/api/health/startup',
  },
  metrics: {
    basic: '/api/metrics',
    prometheus: '/api/metrics/prometheus',
  },

  // Auth
  auth: {
    register: '/api/auth/register',
    signup: '/signup',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
    refresh: '/api/auth/refresh',
    session: '/api/auth/session',
    trackFailedLogin: '/api/auth/track-failed-login',
    verifyEmail: (email: string, signature: string) =>
      `/verification/email/${email}?signature=${signature}`,
    verifyEmailToken: (token: string) => `/api/auth/verify-email/${token}`,
    validateUser: (id: string | number, token: string) =>
      `/validate/${id}/${token}`,
    mfa: {
      setup: '/api/auth/mfa/setup',
      verify: '/api/auth/mfa/verify',
      disable: '/api/auth/mfa/disable',
    },
  },

  // User
  user: {
    list: '/user',
    byId: (id: number) => `/user/${id}`,
    byUserType: (userTypeId: number) => `/users/${userTypeId}`,
    updateNames: '/users/update/names',
    updateEmail: '/update/email',
    updatePhoto: (id: number) => `/photoProfile/${id}`,
    settings: '/settings',
  },

  // Resume Profiles
  profiles: {
    list: '/api/profiles',
    upload: '/api/profiles/upload',
    byId: (id: number) => `/api/profiles/${id}`,
    setActive: (id: number) => `/api/profiles/${id}/set-active`,
    update: (id: number) => `/api/profiles/${id}`,
    delete: (id: number) => `/api/profiles/${id}`,
    activeStatus: (id: number) => `/api/profiles/${id}/active-status`,
  },

  // Logs & Events
  logs: '/logs',
  event: '/event',

  // Translation
  translation: (code: string) => `/translate/${code}.json`,

  // Career Recommendations
  career: {
    analyzeFile: '/api/career/analyze/file',
    analyzeText: '/api/career/analyze/text',
    getAnalysis: (id: number) => `/api/career/analysis/${id}`,
    getHistory: '/api/career/history',
    exportAnalysis: (id: number) => `/api/career/export/${id}`,
    deleteAnalysis: (id: number) => `/api/career/analysis/${id}`,
    listRoles: '/api/career/roles',
    getRoleDetails: (roleId: string) => `/api/career/roles/${roleId}`,
    analyzeAnonymous: '/api/career/analyze-anonymous',
    matchAnonymous: '/api/career/match-anonymous',
    getGuestSession: (sessionId: string) => `/api/career/session/${sessionId}`,
    deleteGuestSession: (sessionId: string) => `/api/career/session/${sessionId}`,
  },

  // Jobs Management
  jobs: {
    list: '/api/jobs',
    byId: (id: number) => `/api/jobs/${id}`,
    search: '/api/jobs/search',
    create: '/api/jobs',
    update: (id: number) => `/api/jobs/${id}`,
    delete: (id: number) => `/api/jobs/${id}`,
    statistics: '/api/jobs/statistics',
    save: (id: number) => `/api/jobs/${id}/save`,
    unsave: (id: number) => `/api/jobs/${id}/save`,
    saved: '/api/jobs/saved',
    apply: (id: number) => `/api/jobs/${id}/apply`,
    applications: '/api/jobs/applications',
    updateApplicationStatus: (applicationId: number) => 
      `/api/jobs/applications/${applicationId}/status`,
  },

  // Scraper
  scraper: {
    start: '/api/scraping/start',
    sessions: '/api/scraping/sessions',
    session: (id: number | string) => `/api/scraping/sessions/${id}`,
    stop: (id: number | string) => `/api/scraping/sessions/${id}/stop`,
  },

  // Companies
  companies: {
    list: '/api/companies',
    byId: (id: number) => `/api/companies/${id}`,
    search: '/api/companies/search',
    jobs: (id: number) => `/api/companies/${id}/jobs`,
    create: '/api/companies',
    update: (id: number) => `/api/companies/${id}`,
    delete: (id: number) => `/api/companies/${id}`,
  },

  // Job Analysis
  jobAnalysis: {
    list: '/api/analysis',
    byJobId: (jobId: number) => `/api/analysis/jobs/${jobId}/analysis`,
    stats: '/api/analysis/stats',
    recommended: '/api/analysis/recommended',
    create: '/api/analysis',
    update: (jobId: number) => `/api/analysis/${jobId}`,
    delete: (jobId: number) => `/api/analysis/${jobId}`,
    bulkCreate: '/api/analysis/bulk',
    bulkDelete: '/api/analysis/bulk-delete',
  },

  // Statistics
  statistics: {
    overview: '/api/statistics/overview',
    jobsByLocation: '/api/statistics/jobs-by-location',
    jobsByCompany: '/api/statistics/jobs-by-company',
    jobsByType: '/api/statistics/jobs-by-type',
    jobsByExperience: '/api/statistics/jobs-by-experience',
    scrapingActivity: '/api/statistics/scraping-activity',
    topSkills: '/api/statistics/top-skills',
    recentJobs: '/api/statistics/recent-jobs',
    sessionStatistics: '/api/statistics/session-statistics',
    trends: '/api/statistics/trends',
  },

  // Dashboard
  dashboard: {
    overview: '/api/dashboard/overview',
    stats: '/api/dashboard/stats',
    recentApplications: '/api/dashboard/recent-applications',
    recommendations: '/api/dashboard/recommendations',
  },

  // Automation
  automation: {
    config: '/api/automation/config',
    updateConfig: '/api/automation/config',
    start: '/api/automation/start',
    stop: '/api/automation/stop',
    status: '/api/automation/status',
    history: '/api/automation/history',
    stats: '/api/automation/stats',
  },

  // Notifications
  notifications: {
    list: '/api/notifications',
    markAsRead: (id: number) => `/api/notifications/${id}/read`,
    markAllAsRead: '/api/notifications/read-all',
    delete: (id: number) => `/api/notifications/${id}`,
    clearAll: '/api/notifications/clear-all',
    preferences: '/api/notifications/preferences',
    updatePreferences: '/api/notifications/preferences',
    unreadCount: '/api/notifications/unread-count',
    websocket: '/api/notifications/ws',
  },

  // Server-Sent Events
  sse: {
    scrapingProgress: (sessionId: number | string) => `/api/sse/scraping/${sessionId}`,
    analysisProgress: (analysisId: number) => `/api/sse/analysis/${analysisId}`,
  },

  // Admin Panel
  admin: {
    dashboard: '/api/admin/dashboard',
    users: {
      list: '/api/admin/users',
      byId: (id: number) => `/api/admin/users/${id}`,
      update: (id: number) => `/api/admin/users/${id}`,
      bulkAction: '/api/admin/users/bulk',
    },
    securityLogs: '/api/admin/security-logs',
  },

  // RBAC & Permissions
  rbac: {
    permissions: {
      list: '/api/admin/rbac/permissions',
      byId: (id: number) => `/api/admin/rbac/permissions/${id}`,
      grant: '/api/admin/rbac/permissions/grant',
      revoke: '/api/admin/rbac/permissions/revoke',
    },
    roles: {
      permissions: (role: string) => `/api/admin/rbac/roles/${role}/permissions`,
      assignPermission: '/api/admin/rbac/roles/assign-permission',
    },
    users: {
      assignRole: '/api/admin/rbac/users/assign-role',
    },
  },

  // Security
  security: {
    cspReport: '/api/security/csp-report',
    cspReportAlt: '/api/security/report/csp',
    headersTest: '/api/security/security-headers-test',
  },

  // Audit Logging
  audit: {
    logs: '/api/audit/logs',
    export: '/api/audit/logs/export',
    statistics: '/api/audit/statistics',
    compliance: '/api/audit/compliance',
  },

  // Backup & Disaster Recovery
  backup: {
    create: '/api/backup/create',
    list: '/api/backup/list',
    byId: (id: number | string) => `/api/backup/${id}`,
    verify: (id: number | string) => `/api/backup/${id}/verify`,
    restore: '/api/backup/restore',
    pitr: '/api/backup/pitr',
    testRestore: (id: number | string) => `/api/backup/${id}/test`,
    rpoStatus: '/api/backup/rpo-status',
  },

  // GDPR Compliance
  gdpr: {
    dataExport: '/api/gdpr/data-export',
    downloadExport: (exportId: number | string) => `/api/gdpr/export/${exportId}/download`,
    dataDeletion: '/api/gdpr/data-deletion',
    verifyDeletion: (requestId: number | string) => `/api/gdpr/deletion/${requestId}/verify`,
    consent: '/api/gdpr/consent',
    updateConsent: (consentId: number) => `/api/gdpr/consent/${consentId}`,
    consentStatus: '/api/gdpr/consent/status',
    retentionReport: '/api/gdpr/retention-report',
    processingActivities: '/api/gdpr/processing-activities',
  },
} as const

export const QUERY_KEYS = {
  // Health & Metrics
  health: {
    all: ['health'] as const,
    basic: ['health', 'basic'] as const,
    detailed: ['health', 'detailed'] as const,
  },
  metrics: {
    all: ['metrics'] as const,
    basic: ['metrics', 'basic'] as const,
    prometheus: ['metrics', 'prometheus'] as const,
  },

  // Auth
  auth: {
    all: ['auth'] as const,
    session: ['auth', 'session'] as const,
    profileSettings: ['auth', 'profile-settings'] as const,
    validateUser: (id: string | number, token: string) => ['auth', 'validate', id, token] as const,
    mfa: {
      status: ['auth', 'mfa', 'status'] as const,
    },
  },
  
  translation: (code: string) => ['translation', code] as const,
  settings: ['settings'] as const,
  validateUser: (id: string | number, token: string) => ['validateUser', id, token] as const,
  categories: ['categories'] as const,
  participants: {
    all: ['participants'] as const,
    byEdition: (editionId: number) => ['edition', 'participant', editionId] as const,
    bySlug: (slug: string) => ['participant', slug] as const,
    phase: ['participants', 'phase'] as const,
  },
 
  users: {
    all: ['users'] as const,
    byId: (id: number) => ['users', id] as const,
    byUserType: (userTypeId: number) => ['users', userTypeId] as const,
  },

  // Resume Profiles
  profiles: {
    all: ['profiles'] as const,
    byId: (id: number) => ['profiles', id] as const,
    active: ['profiles', 'active'] as const,
    activeStatus: (id: number) => ['profiles', id, 'active-status'] as const,
  },
 
  // Career
  career: {
    all: ['career'] as const,
    analysis: (id: number) => ['career', 'analysis', id] as const,
    history: (email: string) => ['career', 'history', email] as const,
    roles: ['career', 'roles'] as const,
    roleDetails: (roleId: string) => ['career', 'role', roleId] as const,
    guestSession: (sessionId: string) => ['career', 'guest', sessionId] as const,
  },

  // Jobs
  jobs: {
    all: ['jobs'] as const,
    list: (params: string) => ['jobs', 'list', params] as const,
    byId: (id: number) => ['jobs', id] as const,
    search: (query: string) => ['jobs', 'search', query] as const,
    statistics: ['jobs', 'statistics'] as const,
    saved: ['jobs', 'saved'] as const,
    applications: ['jobs', 'applications'] as const,
    applicationById: (id: number) => ['jobs', 'applications', id] as const,
  },

  // Scraper
  scraper: {
    all: ['scraper'] as const,
    sessions: (params: string) => ['scraper', 'sessions', params] as const,
    session: (id: number | string) => ['scraper', 'session', id] as const,
    activeSessions: ['scraper', 'active'] as const,
    history: (limit: number) => ['scraper', 'history', limit] as const,
  },

  // Companies
  companies: {
    all: ['companies'] as const,
    list: (params: string) => ['companies', 'list', params] as const,
    byId: (id: number) => ['companies', id] as const,
    search: (query: string) => ['companies', 'search', query] as const,
    jobs: (companyId: number, params: string) => ['companies', companyId, 'jobs', params] as const,
  },

  // Job Analysis
  jobAnalysis: {
    all: ['jobAnalysis'] as const,
    list: (params: string) => ['jobAnalysis', 'list', params] as const,
    byJobId: (jobId: number) => ['jobAnalysis', 'job', jobId] as const,
    stats: ['jobAnalysis', 'stats'] as const,
    recommended: (params: string) => ['jobAnalysis', 'recommended', params] as const,
  },

  // Statistics
  statistics: {
    all: ['statistics'] as const,
    overview: ['statistics', 'overview'] as const,
    jobsByLocation: (params: string) => ['statistics', 'jobs-by-location', params] as const,
    jobsByCompany: (params: string) => ['statistics', 'jobs-by-company', params] as const,
    jobsByType: ['statistics', 'jobs-by-type'] as const,
    jobsByExperience: ['statistics', 'jobs-by-experience'] as const,
    scrapingActivity: (params: string) => ['statistics', 'scraping-activity', params] as const,
    topSkills: (params: string) => ['statistics', 'top-skills', params] as const,
    recentJobs: (params: string) => ['statistics', 'recent-jobs', params] as const,
    sessionStatistics: ['statistics', 'session-statistics'] as const,
    trends: (params: string) => ['statistics', 'trends', params] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    overview: ['dashboard', 'overview'] as const,
    stats: ['dashboard', 'stats'] as const,
    recentApplications: ['dashboard', 'recent-applications'] as const,
    recommendations: ['dashboard', 'recommendations'] as const,
  },

  // Automation
  automation: {
    all: ['automation'] as const,
    config: ['automation', 'config'] as const,
    status: ['automation', 'status'] as const,
    history: (params: string) => ['automation', 'history', params] as const,
    stats: ['automation', 'stats'] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: (params: string) => ['notifications', 'list', params] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
    preferences: ['notifications', 'preferences'] as const,
  },

  // Admin
  admin: {
    all: ['admin'] as const,
    dashboard: ['admin', 'dashboard'] as const,
    users: {
      all: ['admin', 'users'] as const,
      byId: (id: number) => ['admin', 'users', id] as const,
      list: (params: string) => ['admin', 'users', 'list', params] as const,
    },
    securityLogs: (params: string) => ['admin', 'security-logs', params] as const,
  },

  // RBAC
  rbac: {
    all: ['rbac'] as const,
    permissions: {
      all: ['rbac', 'permissions'] as const,
      byId: (id: number) => ['rbac', 'permissions', id] as const,
    },
    roles: {
      permissions: (role: string) => ['rbac', 'roles', role, 'permissions'] as const,
    },
  },

  // Audit
  audit: {
    all: ['audit'] as const,
    logs: (params: string) => ['audit', 'logs', params] as const,
    statistics: ['audit', 'statistics'] as const,
    compliance: ['audit', 'compliance'] as const,
  },

  // Backup
  backup: {
    all: ['backup'] as const,
    list: ['backup', 'list'] as const,
    byId: (id: number | string) => ['backup', id] as const,
    rpoStatus: ['backup', 'rpo-status'] as const,
  },

  // GDPR
  gdpr: {
    all: ['gdpr'] as const,
    exports: ['gdpr', 'exports'] as const,
    exportById: (id: number | string) => ['gdpr', 'export', id] as const,
    consentStatus: ['gdpr', 'consent', 'status'] as const,
    retentionReport: ['gdpr', 'retention-report'] as const,
    processingActivities: ['gdpr', 'processing-activities'] as const,
  },
} as const
