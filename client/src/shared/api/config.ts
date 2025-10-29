// src/shared/api/config.ts

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:8000'),
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
} as const

export const ENDPOINTS = {
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

  // Categories
  category: {
    list: '/category',
  },

  // Participants
  participant: {
    list: '/participant',
    bySlug: (slug: string) => `/participant/${slug}`,
    byEdition: (editionId: number) => `/edition/${editionId}/participant`,
    music: '/participant/music',
    drawer: '/participant/drawer',
    phase: '/participant/phase',
    allPhases: '/participants/phase',
  },

  // Phases
  phase: {
    list: '/phase',
    byId: (id: number) => `/phase/${id}`,
    participants: (id: number) => `/phase/${id}/participant`,
  },

  // Judge
  judge: {
    list: '/judge',
    byId: (id: number) => `/judge/${id}`,
    phaseVote: '/judge/phase/vote',
  },

  // Contest & Edition
  contest: {
    list: '/contest',
  },
  edition: {
    list: '/edition',
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
  },

  // Scraper
  scraper: {
    start: '/api/scraping/start',
    sessions: '/api/scraping/sessions',
    session: (id: number) => `/api/scraping/sessions/${id}`,
    stop: (id: number) => `/api/scraping/sessions/${id}/stop`,
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
    list: '/api/analysis/analysis',
    byJobId: (jobId: number) => `/api/analysis/jobs/${jobId}/analysis`,
    stats: '/api/analysis/analysis/stats',
    recommended: '/api/analysis/analysis/recommended',
    create: '/api/analysis/analysis',
    update: (jobId: number) => `/api/analysis/analysis/${jobId}`,
    delete: (jobId: number) => `/api/analysis/analysis/${jobId}`,
    bulkCreate: '/api/analysis/analysis/bulk',
    bulkDelete: '/api/analysis/analysis/bulk-delete',
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
} as const

export const QUERY_KEYS = {
  // Auth
  auth: {
    all: ['auth'] as const,
    session: ['auth', 'session'] as const,
    profileSettings: ['auth', 'profile-settings'] as const,
    validateUser: (id: string | number, token: string) => ['auth', 'validate', id, token] as const,
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
  phases: {
    all: ['phases'] as const,
    participants: (id: number) => ['phase', 'participant', id] as const,
  },
  users: {
    all: ['users'] as const,
    byId: (id: number) => ['users', id] as const,
    byUserType: (userTypeId: number) => ['users', userTypeId] as const,
  },
  judges: {
    all: ['judges'] as const,
    byId: (id: number) => ['judge', id] as const,
    vote: ['judge', 'vote'] as const,
  },
  contest: ['contest'] as const,
  edition: ['edition'] as const,
  logs: ['logs'] as const,
  event: ['eventData'] as const,
  
  // Career
  career: {
    all: ['career'] as const,
    analysis: (id: number) => ['career', 'analysis', id] as const,
    history: (email: string) => ['career', 'history', email] as const,
    roles: ['career', 'roles'] as const,
    roleDetails: (roleId: string) => ['career', 'role', roleId] as const,
  },

  // Jobs
  jobs: {
    all: ['jobs'] as const,
    list: (params: string) => ['jobs', 'list', params] as const,
    byId: (id: number) => ['jobs', id] as const,
    search: (query: string) => ['jobs', 'search', query] as const,
    statistics: ['jobs', 'statistics'] as const,
  },

  // Scraper
  scraper: {
    all: ['scraper'] as const,
    sessions: (params: string) => ['scraper', 'sessions', params] as const,
    session: (id: number) => ['scraper', 'session', id] as const,
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
} as const
