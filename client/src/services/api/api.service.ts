// src/shared/api/services/api.service.ts

import { apiClient } from './api-client'
import { ENDPOINTS } from './config'
import { AxiosResponse } from 'axios'

/**
 * Health & Metrics Service
 */
export const healthService = {
  getBasicHealth: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.health.basic)
  },

  getLiveness: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.health.live)
  },

  getReadiness: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.health.ready)
  },

  getDetailedHealth: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.health.detailed)
  },

  getStartup: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.health.startup)
  },
}

export const metricsService = {
  getMetrics: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.metrics.basic)
  },

  getPrometheusMetrics: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.metrics.prometheus)
  },
}

/**
 * Translation Service
 */
export const translationService = {
  getTranslation: async (code: string = 'fr'): Promise<AxiosResponse> => {
    return apiClient.getWithFallback(
      ENDPOINTS.translation(code),
      {}
    )
  },
}

/**
 * Auth Service
 */
export const authService = {
  register: (body: any): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.auth.register, body)
  },

  signup: (body: any): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.auth.signup, body)
  },

  login: (body: any): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.auth.login, body)
  },

  logout: (): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.auth.logout)
  },

  forgotPassword: (body: any): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.auth.forgotPassword, body)
  },

  resetPassword: (body: any): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.auth.resetPassword, body)
  },

  refreshToken: (): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.auth.refresh)
  },

  getSession: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.auth.session)
  },

  trackFailedLogin: (body: any): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.auth.trackFailedLogin, body)
  },

  verifyEmail: (email: string, signature: string): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.auth.verifyEmail(email, signature))
  },

  verifyEmailToken: (token: string): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.auth.verifyEmailToken(token))
  },

  validateUser: (id: string | number, token: string): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.auth.validateUser(id, token))
  },

  mfa: {
    setup: (): Promise<AxiosResponse> => {
      return apiClient.post(ENDPOINTS.auth.mfa.setup)
    },

    verify: (code: string): Promise<AxiosResponse> => {
      return apiClient.post(ENDPOINTS.auth.mfa.verify, { code })
    },

    disable: (): Promise<AxiosResponse> => {
      return apiClient.post(ENDPOINTS.auth.mfa.disable)
    },
  },
}

/**
 * User Service
 */
export const userService = {
  getSettings: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.user.settings)
  },

  getAllUsers: (query: string = ''): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.user.list}${query}`)
  },

  getUserById: (id: number, query: string = ''): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.user.byId(id)}${query}`)
  },

  getUsersByUserType: (userTypeId: number): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.user.byUserType(userTypeId))
  },

  updateNames: (body: { firstname?: string; lastname?: string }): Promise<AxiosResponse> => {
    return apiClient.put(ENDPOINTS.user.updateNames, body)
  },

  updateEmail: (body: { email?: string; password: string }): Promise<AxiosResponse> => {
    return apiClient.put(ENDPOINTS.user.updateEmail, body)
  },

  updatePhotoProfile: (data: { id: number; file: File; [key: string]: any }): Promise<AxiosResponse> => {
    return apiClient.uploadFormData(ENDPOINTS.user.updatePhoto(data.id), data, 'patch')
  },
}

/**
 * Resume Profiles Service
 */
export const profileService = {
  getProfiles: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.profiles.list)
  },

  getProfileById: (id: number): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.profiles.byId(id))
  },

  uploadProfile: (data: { file: File; name: string; description?: string }): Promise<AxiosResponse> => {
    return apiClient.uploadFile(ENDPOINTS.profiles.upload, [data.file], 'file', {
      name: data.name,
      description: data.description,
    })
  },

  setActiveProfile: (id: number): Promise<AxiosResponse> => {
    return apiClient.put(ENDPOINTS.profiles.setActive(id))
  },

  updateProfile: (id: number, body: any): Promise<AxiosResponse> => {
    return apiClient.put(ENDPOINTS.profiles.update(id), body)
  },

  deleteProfile: (id: number): Promise<AxiosResponse> => {
    return apiClient.delete(ENDPOINTS.profiles.delete(id))
  },

  getActiveStatus: (id: number): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.profiles.activeStatus(id))
  },
}

/**
 * Career Recommendations Service
 */
export const careerService = {
  analyzeFile: (file: File, params?: any): Promise<AxiosResponse> => {
    return apiClient.uploadFile(ENDPOINTS.career.analyzeFile, [file], 'resume_file', params)
  },

  analyzeText: (body: { resume_text: string; user_email?: string }): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.career.analyzeText, body)
  },

  getAnalysis: (id: number): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.career.getAnalysis(id))
  },

  getHistory: (email: string, limit?: number): Promise<AxiosResponse> => {
    const params = new URLSearchParams({ user_email: email })
    if (limit) params.append('limit', String(limit))
    return apiClient.get(`${ENDPOINTS.career.getHistory}?${params}`)
  },

  exportAnalysis: (id: number, format: 'markdown' | 'json' | 'txt' = 'markdown'): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.career.exportAnalysis(id)}?format=${format}`)
  },

  deleteAnalysis: (id: number): Promise<AxiosResponse> => {
    return apiClient.delete(ENDPOINTS.career.deleteAnalysis(id))
  },

  listRoles: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.career.listRoles)
  },

  getRoleDetails: (roleId: string): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.career.getRoleDetails(roleId))
  },

  analyzeAnonymous: (file: File): Promise<AxiosResponse> => {
    return apiClient.uploadFile(ENDPOINTS.career.analyzeAnonymous, [file], 'resume_file')
  },

  matchAnonymous: (sessionId: string): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.career.matchAnonymous}?session_id=${sessionId}`)
  },

  getGuestSession: (sessionId: string): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.career.getGuestSession(sessionId))
  },

  deleteGuestSession: (sessionId: string): Promise<AxiosResponse> => {
    return apiClient.delete(ENDPOINTS.career.deleteGuestSession(sessionId))
  },
}

/**
 * Jobs Service
 */
export const jobsService = {
  getJobs: (params?: any): Promise<AxiosResponse> => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiClient.get(`${ENDPOINTS.jobs.list}${query}`)
  },

  getJobById: (id: number): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.jobs.byId(id))
  },

  searchJobs: (query: string, params?: any): Promise<AxiosResponse> => {
    const searchParams = new URLSearchParams({ q: query, ...params })
    return apiClient.get(`${ENDPOINTS.jobs.search}?${searchParams}`)
  },

  createJob: (body: any): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.jobs.create, body)
  },

  updateJob: (id: number, body: any): Promise<AxiosResponse> => {
    return apiClient.put(ENDPOINTS.jobs.update(id), body)
  },

  deleteJob: (id: number): Promise<AxiosResponse> => {
    return apiClient.delete(ENDPOINTS.jobs.delete(id))
  },

  getStatistics: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.jobs.statistics)
  },

  saveJob: (id: number, notes?: string): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.jobs.save(id), { notes })
  },

  unsaveJob: (id: number): Promise<AxiosResponse> => {
    return apiClient.delete(ENDPOINTS.jobs.unsave(id))
  },

  getSavedJobs: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.jobs.saved)
  },

  applyToJob: (id: number, body: { profile_id: number; cover_letter?: string }): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.jobs.apply(id), body)
  },

  getApplications: (params?: any): Promise<AxiosResponse> => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiClient.get(`${ENDPOINTS.jobs.applications}${query}`)
  },

  updateApplicationStatus: (applicationId: number, status: string): Promise<AxiosResponse> => {
    return apiClient.put(ENDPOINTS.jobs.updateApplicationStatus(applicationId), { status })
  },
}

/**
 * Scraper Service
 */
export const scraperService = {
  startScraping: (body: any): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.scraper.start, body)
  },

  getSessions: (params?: any): Promise<AxiosResponse> => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiClient.get(`${ENDPOINTS.scraper.sessions}${query}`)
  },

  getSession: (id: number | string): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.scraper.session(id))
  },

  stopSession: (id: number | string): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.scraper.stop(id))
  },
}

/**
 * Companies Service
 */
export const companiesService = {
  getCompanies: (params?: any): Promise<AxiosResponse> => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiClient.get(`${ENDPOINTS.companies.list}${query}`)
  },

  getCompanyById: (id: number): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.companies.byId(id))
  },

  searchCompanies: (query: string, params?: any): Promise<AxiosResponse> => {
    const searchParams = new URLSearchParams({ q: query, ...params })
    return apiClient.get(`${ENDPOINTS.companies.search}?${searchParams}`)
  },

  getCompanyJobs: (id: number, params?: any): Promise<AxiosResponse> => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiClient.get(`${ENDPOINTS.companies.jobs(id)}${query}`)
  },

  createCompany: (body: any): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.companies.create, body)
  },

  updateCompany: (id: number, body: any): Promise<AxiosResponse> => {
    return apiClient.put(ENDPOINTS.companies.update(id), body)
  },

  deleteCompany: (id: number): Promise<AxiosResponse> => {
    return apiClient.delete(ENDPOINTS.companies.delete(id))
  },
}

/**
 * Job Analysis Service
 */
export const jobAnalysisService = {
  getAnalyses: (params?: any): Promise<AxiosResponse> => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiClient.get(`${ENDPOINTS.jobAnalysis.list}${query}`)
  },

  getAnalysisByJobId: (jobId: number): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.jobAnalysis.byJobId(jobId))
  },

  getStats: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.jobAnalysis.stats)
  },

  getRecommended: (params?: any): Promise<AxiosResponse> => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiClient.get(`${ENDPOINTS.jobAnalysis.recommended}${query}`)
  },

  createAnalysis: (body: any): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.jobAnalysis.create, body)
  },

  updateAnalysis: (jobId: number, body: any): Promise<AxiosResponse> => {
    return apiClient.put(ENDPOINTS.jobAnalysis.update(jobId), body)
  },

  deleteAnalysis: (jobId: number): Promise<AxiosResponse> => {
    return apiClient.delete(ENDPOINTS.jobAnalysis.delete(jobId))
  },

  bulkCreate: (body: any[]): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.jobAnalysis.bulkCreate, body)
  },

  bulkDelete: (jobIds: number[]): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.jobAnalysis.bulkDelete, { job_ids: jobIds })
  },
}

/**
 * Statistics Service
 */
export const statisticsService = {
  getOverview: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.statistics.overview)
  },

  getJobsByLocation: (params?: any): Promise<AxiosResponse> => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiClient.get(`${ENDPOINTS.statistics.jobsByLocation}${query}`)
  },

  getJobsByCompany: (params?: any): Promise<AxiosResponse> => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiClient.get(`${ENDPOINTS.statistics.jobsByCompany}${query}`)
  },

  getJobsByType: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.statistics.jobsByType)
  },

  getJobsByExperience: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.statistics.jobsByExperience)
  },

  getScrapingActivity: (days: number = 30): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.statistics.scrapingActivity}?days=${days}`)
  },

  getTopSkills: (limit: number = 20): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.statistics.topSkills}?limit=${limit}`)
  },

  getRecentJobs: (limit: number = 10): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.statistics.recentJobs}?limit=${limit}`)
  },

  getSessionStatistics: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.statistics.sessionStatistics)
  },

  getTrends: (days: number = 30): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.statistics.trends}?days=${days}`)
  },
}

/**
 * Dashboard Service
 */
export const dashboardService = {
  getOverview: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.dashboard.overview)
  },

  getStats: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.dashboard.stats)
  },

  getRecentApplications: (limit?: number): Promise<AxiosResponse> => {
    const query = limit ? `?limit=${limit}` : ''
    return apiClient.get(`${ENDPOINTS.dashboard.recentApplications}${query}`)
  },

  getRecommendations: (limit?: number): Promise<AxiosResponse> => {
    const query = limit ? `?limit=${limit}` : ''
    return apiClient.get(`${ENDPOINTS.dashboard.recommendations}${query}`)
  },
}

/**
 * Automation Service
 */
export const automationService = {
  getConfig: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.automation.config)
  },

  updateConfig: (body: any): Promise<AxiosResponse> => {
    return apiClient.put(ENDPOINTS.automation.updateConfig, body)
  },

  start: (body?: any): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.automation.start, body)
  },

  stop: (): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.automation.stop)
  },

  getStatus: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.automation.status)
  },

  getHistory: (params?: any): Promise<AxiosResponse> => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiClient.get(`${ENDPOINTS.automation.history}${query}`)
  },

  getStats: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.automation.stats)
  },
}

/**
 * Notifications Service
 */
export const notificationsService = {
  getNotifications: (params?: any): Promise<AxiosResponse> => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiClient.get(`${ENDPOINTS.notifications.list}${query}`)
  },

  markAsRead: (id: number): Promise<AxiosResponse> => {
    return apiClient.put(ENDPOINTS.notifications.markAsRead(id))
  },

  markAllAsRead: (): Promise<AxiosResponse> => {
    return apiClient.put(ENDPOINTS.notifications.markAllAsRead)
  },

  deleteNotification: (id: number): Promise<AxiosResponse> => {
    return apiClient.delete(ENDPOINTS.notifications.delete(id))
  },

  clearAll: (): Promise<AxiosResponse> => {
    return apiClient.delete(ENDPOINTS.notifications.clearAll)
  },

  getPreferences: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.notifications.preferences)
  },

  updatePreferences: (body: any): Promise<AxiosResponse> => {
    return apiClient.put(ENDPOINTS.notifications.updatePreferences, body)
  },

  getUnreadCount: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.notifications.unreadCount)
  },
}

/**
 * Admin Service
 */
export const adminService = {
  getDashboard: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.admin.dashboard)
  },

  getUsers: (params?: any): Promise<AxiosResponse> => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiClient.get(`${ENDPOINTS.admin.users.list}${query}`)
  },

  getUserById: (id: number): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.admin.users.byId(id))
  },

  updateUser: (id: number, body: any): Promise<AxiosResponse> => {
    return apiClient.put(ENDPOINTS.admin.users.update(id), body)
  },

  bulkAction: (body: { user_ids: number[]; action: string; reason?: string }): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.admin.users.bulkAction, body)
  },

  getSecurityLogs: (params?: any): Promise<AxiosResponse> => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiClient.get(`${ENDPOINTS.admin.securityLogs}${query}`)
  },
}

/**
 * RBAC Service
 */
export const rbacService = {
  getPermissions: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.rbac.permissions.list)
  },

  getPermissionById: (id: number): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.rbac.permissions.byId(id))
  },

  grantPermission: (body: { user_id: number; permission_id: number; reason?: string; expires_at?: string }): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.rbac.permissions.grant, body)
  },

  revokePermission: (body: { user_id: number; permission_id: number; reason?: string }): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.rbac.permissions.revoke, body)
  },

  getRolePermissions: (role: string): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.rbac.roles.permissions(role))
  },

  assignRolePermission: (body: { role: string; permission_id: number }): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.rbac.roles.assignPermission, body)
  },

  assignUserRole: (body: { user_id: number; new_role: string }): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.rbac.users.assignRole, body)
  },
}

/**
 * Security Service
 */
export const securityService = {
  reportCSPViolation: (body: any): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.security.cspReport, body)
  },

  testHeaders: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.security.headersTest)
  },
}

/**
 * Audit Service
 */
export const auditService = {
  getLogs: (params?: any): Promise<AxiosResponse> => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiClient.get(`${ENDPOINTS.audit.logs}${query}`)
  },

  exportLogs: (params?: any): Promise<AxiosResponse> => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiClient.get(`${ENDPOINTS.audit.export}${query}`)
  },

  getStatistics: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.audit.statistics)
  },

  getCompliance: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.audit.compliance)
  },
}

/**
 * Backup Service
 */
export const backupService = {
  createBackup: (body?: { backup_type?: string; verify_after_creation?: boolean }): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.backup.create, body)
  },

  listBackups: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.backup.list)
  },

  getBackupById: (id: number | string): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.backup.byId(id))
  },

  verifyBackup: (id: number | string): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.backup.verify(id))
  },

  restoreBackup: (body: { backup_id: string; verify_before_restore?: boolean; create_backup_before_restore?: boolean }): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.backup.restore, body)
  },

  pointInTimeRestore: (body: { target_timestamp: string; verify_before_restore?: boolean }): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.backup.pitr, body)
  },

  testRestore: (id: number | string): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.backup.testRestore(id))
  },

  getRPOStatus: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.backup.rpoStatus)
  },
}

/**
 * GDPR Service
 */
export const gdprService = {
  requestDataExport: (format: 'json' | 'csv' = 'json'): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.gdpr.dataExport}?format=${format}`)
  },

  downloadExport: (exportId: number | string, format: 'json' | 'csv' = 'json'): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.gdpr.downloadExport(exportId)}?format=${format}`)
  },

  requestDataDeletion: (body: { anonymize?: boolean; reason?: string; verification_code?: string }): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.gdpr.dataDeletion, body)
  },

  verifyDeletion: (requestId: number | string, body: { verification_code: string }): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.gdpr.verifyDeletion(requestId), body)
  },

  giveConsent: (body: { consent_type: string; consent_given: boolean; consent_version?: string }): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.gdpr.consent, body)
  },

  updateConsent: (consentId: number, body: { consent_given: boolean }): Promise<AxiosResponse> => {
    return apiClient.put(ENDPOINTS.gdpr.updateConsent(consentId), body)
  },

  getConsentStatus: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.gdpr.consentStatus)
  },

  getRetentionReport: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.gdpr.retentionReport)
  },

  getProcessingActivities: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.gdpr.processingActivities)
  },
}

/**
 * Logs Service
 */
export const logsService = {
  getAllLogs: (query: string = ''): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.logs}${query}`)
  },
}

/**
 * Event Service (Long Polling)
 */
export const eventService = {
  getEventData: (query: string = ''): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.event}${query}`)
  },
}
