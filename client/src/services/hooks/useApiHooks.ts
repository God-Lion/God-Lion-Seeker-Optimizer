// src/shared/hooks/useApiHooks.ts

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { AxiosError, AxiosResponse } from 'axios'
import { QUERY_KEYS } from '../api/config'
import {
  healthService,
  metricsService,
  authService,
  profileService,
  careerService,
  jobsService,
  scraperService,
  companiesService,
  jobAnalysisService,
  statisticsService,
  dashboardService,
  automationService,
  notificationsService,
  adminService,
  rbacService,
  auditService,
  backupService,
  gdprService,
} from '../api/api.service'

/**
 * Health & Metrics Hooks
 */
export function useBasicHealth(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.health.basic,
    queryFn: () => healthService.getBasicHealth(),
    staleTime: 1000 * 30,
    ...options,
  })
}

export function useDetailedHealth(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.health.detailed,
    queryFn: () => healthService.getDetailedHealth(),
    staleTime: 1000 * 30,
    ...options,
  })
}

export function useMetrics(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.metrics.basic,
    queryFn: () => metricsService.getMetrics(),
    staleTime: 1000 * 60,
    ...options,
  })
}

/**
 * Auth Hooks - MFA
 */
export function useMFASetup(options?: UseMutationOptions<AxiosResponse, AxiosError>) {
  return useMutation({
    mutationFn: () => authService.mfa.setup(),
    ...options,
  })
}

export function useMFAVerify(options?: UseMutationOptions<AxiosResponse, AxiosError, string>) {
  return useMutation({
    mutationFn: (code: string) => authService.mfa.verify(code),
    ...options,
  })
}

export function useMFADisable(options?: UseMutationOptions<AxiosResponse, AxiosError>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => authService.mfa.disable(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.session })
    },
    ...options,
  })
}

/**
 * Resume Profiles Hooks
 */
export function useProfiles(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.profiles.all,
    queryFn: () => profileService.getProfiles(),
    ...options,
  })
}

export function useProfile(id: number, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.profiles.byId(id),
    queryFn: () => profileService.getProfileById(id),
    enabled: !!id,
    ...options,
  })
}

export function useUploadProfile(options?: UseMutationOptions<AxiosResponse, AxiosError, { file: File; name: string; description?: string }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => profileService.uploadProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles.all })
    },
    ...options,
  })
}

export function useSetActiveProfile(options?: UseMutationOptions<AxiosResponse, AxiosError, number>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => profileService.setActiveProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles.active })
    },
    ...options,
  })
}

export function useUpdateProfile(options?: UseMutationOptions<AxiosResponse, AxiosError, { id: number; data: any }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => profileService.updateProfile(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles.byId(variables.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles.all })
    },
    ...options,
  })
}

export function useDeleteProfile(options?: UseMutationOptions<AxiosResponse, AxiosError, number>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => profileService.deleteProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles.all })
    },
    ...options,
  })
}

/**
 * Career Hooks
 */
export function useCareerAnalysis(id: number, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.career.analysis(id),
    queryFn: () => careerService.getAnalysis(id),
    enabled: !!id,
    ...options,
  })
}

export function useCareerHistory(email: string, limit?: number, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.career.history(email),
    queryFn: () => careerService.getHistory(email, limit),
    enabled: !!email,
    ...options,
  })
}

export function useCareerRoles(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.career.roles,
    queryFn: () => careerService.listRoles(),
    staleTime: 1000 * 60 * 60,
    ...options,
  })
}

export function useCareerRoleDetails(roleId: string, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.career.roleDetails(roleId),
    queryFn: () => careerService.getRoleDetails(roleId),
    enabled: !!roleId,
    staleTime: 1000 * 60 * 60,
    ...options,
  })
}

export function useAnalyzeCareerFile(options?: UseMutationOptions<AxiosResponse, AxiosError, { file: File; params?: any }>) {
  return useMutation({
    mutationFn: ({ file, params }) => careerService.analyzeFile(file, params),
    ...options,
  })
}

export function useAnalyzeCareerText(options?: UseMutationOptions<AxiosResponse, AxiosError, { resume_text: string; user_email?: string }>) {
  return useMutation({
    mutationFn: (data) => careerService.analyzeText(data),
    ...options,
  })
}

/**
 * Jobs Hooks
 */
export function useJobs(params?: any, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  const queryString = params ? JSON.stringify(params) : ''
  return useQuery({
    queryKey: QUERY_KEYS.jobs.list(queryString),
    queryFn: () => jobsService.getJobs(params),
    ...options,
  })
}

export function useJob(id: number, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.jobs.byId(id),
    queryFn: () => jobsService.getJobById(id),
    enabled: !!id,
    ...options,
  })
}

export function useSearchJobs(query: string, params?: any, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.jobs.search(query),
    queryFn: () => jobsService.searchJobs(query, params),
    enabled: !!query,
    ...options,
  })
}

export function useSavedJobs(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.jobs.saved,
    queryFn: () => jobsService.getSavedJobs(),
    ...options,
  })
}

export function useJobApplications(params?: any, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.jobs.applications,
    queryFn: () => jobsService.getApplications(params),
    ...options,
  })
}

export function useSaveJob(options?: UseMutationOptions<AxiosResponse, AxiosError, { id: number; notes?: string }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }) => jobsService.saveJob(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs.saved })
    },
    ...options,
  })
}

export function useUnsaveJob(options?: UseMutationOptions<AxiosResponse, AxiosError, number>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => jobsService.unsaveJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs.saved })
    },
    ...options,
  })
}

export function useApplyToJob(options?: UseMutationOptions<AxiosResponse, AxiosError, { id: number; profile_id: number; cover_letter?: string }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, profile_id, cover_letter }) => jobsService.applyToJob(id, { profile_id, cover_letter }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs.applications })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats })
    },
    ...options,
  })
}

export function useUpdateApplicationStatus(options?: UseMutationOptions<AxiosResponse, AxiosError, { applicationId: number; status: string }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ applicationId, status }) => jobsService.updateApplicationStatus(applicationId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs.applications })
    },
    ...options,
  })
}

/**
 * Scraper Hooks
 */
export function useScraperSessions(params?: any, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  const queryString = params ? JSON.stringify(params) : ''
  return useQuery({
    queryKey: QUERY_KEYS.scraper.sessions(queryString),
    queryFn: () => scraperService.getSessions(params),
    ...options,
  })
}

export function useScraperSession(id: number | string, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.scraper.session(id),
    queryFn: () => scraperService.getSession(id),
    enabled: !!id,
    refetchInterval: 2000,
    ...options,
  })
}

export function useStartScraping(options?: UseMutationOptions<AxiosResponse, AxiosError, any>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => scraperService.startScraping(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scraper.all })
    },
    ...options,
  })
}

export function useStopScraping(options?: UseMutationOptions<AxiosResponse, AxiosError, number | string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => scraperService.stopSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scraper.all })
    },
    ...options,
  })
}

/**
 * Companies Hooks
 */
export function useCompanies(params?: any, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  const queryString = params ? JSON.stringify(params) : ''
  return useQuery({
    queryKey: QUERY_KEYS.companies.list(queryString),
    queryFn: () => companiesService.getCompanies(params),
    ...options,
  })
}

export function useCompany(id: number, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.companies.byId(id),
    queryFn: () => companiesService.getCompanyById(id),
    enabled: !!id,
    ...options,
  })
}

export function useCompanyJobs(id: number, params?: any, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  const queryString = params ? JSON.stringify(params) : ''
  return useQuery({
    queryKey: QUERY_KEYS.companies.jobs(id, queryString),
    queryFn: () => companiesService.getCompanyJobs(id, params),
    enabled: !!id,
    ...options,
  })
}

/**
 * Job Analysis Hooks
 */
export function useJobAnalyses(params?: any, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  const queryString = params ? JSON.stringify(params) : ''
  return useQuery({
    queryKey: QUERY_KEYS.jobAnalysis.list(queryString),
    queryFn: () => jobAnalysisService.getAnalyses(params),
    ...options,
  })
}

export function useJobAnalysis(jobId: number, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.jobAnalysis.byJobId(jobId),
    queryFn: () => jobAnalysisService.getAnalysisByJobId(jobId),
    enabled: !!jobId,
    ...options,
  })
}

export function useJobAnalysisStats(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.jobAnalysis.stats,
    queryFn: () => jobAnalysisService.getStats(),
    ...options,
  })
}

export function useRecommendedJobs(params?: any, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  const queryString = params ? JSON.stringify(params) : ''
  return useQuery({
    queryKey: QUERY_KEYS.jobAnalysis.recommended(queryString),
    queryFn: () => jobAnalysisService.getRecommended(params),
    ...options,
  })
}

/**
 * Statistics Hooks
 */
export function useStatisticsOverview(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.statistics.overview,
    queryFn: () => statisticsService.getOverview(),
    staleTime: 1000 * 60 * 5,
    ...options,
  })
}

export function useJobsByLocation(params?: any, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  const queryString = params ? JSON.stringify(params) : ''
  return useQuery({
    queryKey: QUERY_KEYS.statistics.jobsByLocation(queryString),
    queryFn: () => statisticsService.getJobsByLocation(params),
    ...options,
  })
}

export function useJobsByCompany(params?: any, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  const queryString = params ? JSON.stringify(params) : ''
  return useQuery({
    queryKey: QUERY_KEYS.statistics.jobsByCompany(queryString),
    queryFn: () => statisticsService.getJobsByCompany(params),
    ...options,
  })
}

export function useTopSkills(limit: number = 20, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.statistics.topSkills(String(limit)),
    queryFn: () => statisticsService.getTopSkills(limit),
    ...options,
  })
}

/**
 * Dashboard Hooks
 */
export function useDashboardOverview(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.overview,
    queryFn: () => dashboardService.getOverview(),
    ...options,
  })
}

export function useDashboardStats(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.stats,
    queryFn: () => dashboardService.getStats(),
    ...options,
  })
}

export function useDashboardRecentApplications(limit?: number, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.recentApplications,
    queryFn: () => dashboardService.getRecentApplications(limit),
    ...options,
  })
}

export function useDashboardRecommendations(limit?: number, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.recommendations,
    queryFn: () => dashboardService.getRecommendations(limit),
    ...options,
  })
}

/**
 * Automation Hooks
 */
export function useAutomationConfig(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.automation.config,
    queryFn: () => automationService.getConfig(),
    ...options,
  })
}

export function useAutomationStatus(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.automation.status,
    queryFn: () => automationService.getStatus(),
    refetchInterval: 5000,
    ...options,
  })
}

export function useAutomationHistory(params?: any, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  const queryString = params ? JSON.stringify(params) : ''
  return useQuery({
    queryKey: QUERY_KEYS.automation.history(queryString),
    queryFn: () => automationService.getHistory(params),
    ...options,
  })
}

export function useUpdateAutomationConfig(options?: UseMutationOptions<AxiosResponse, AxiosError, any>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => automationService.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.automation.config })
    },
    ...options,
  })
}

export function useStartAutomation(options?: UseMutationOptions<AxiosResponse, AxiosError, any>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => automationService.start(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.automation.status })
    },
    ...options,
  })
}

export function useStopAutomation(options?: UseMutationOptions<AxiosResponse, AxiosError>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => automationService.stop(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.automation.status })
    },
    ...options,
  })
}

/**
 * Notifications Hooks
 */
export function useNotifications(params?: any, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  const queryString = params ? JSON.stringify(params) : ''
  return useQuery({
    queryKey: QUERY_KEYS.notifications.list(queryString),
    queryFn: () => notificationsService.getNotifications(params),
    ...options,
  })
}

export function useNotificationPreferences(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.preferences,
    queryFn: () => notificationsService.getPreferences(),
    ...options,
  })
}

export function useUnreadNotificationCount(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.unreadCount,
    queryFn: () => notificationsService.getUnreadCount(),
    refetchInterval: 30000,
    ...options,
  })
}

export function useMarkNotificationAsRead(options?: UseMutationOptions<AxiosResponse, AxiosError, number>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.unreadCount })
    },
    ...options,
  })
}

export function useMarkAllNotificationsAsRead(options?: UseMutationOptions<AxiosResponse, AxiosError>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.unreadCount })
    },
    ...options,
  })
}

/**
 * Admin Hooks
 */
export function useAdminDashboard(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.admin.dashboard,
    queryFn: () => adminService.getDashboard(),
    ...options,
  })
}

export function useAdminUsers(params?: any, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  const queryString = params ? JSON.stringify(params) : ''
  return useQuery({
    queryKey: QUERY_KEYS.admin.users.list(queryString),
    queryFn: () => adminService.getUsers(params),
    ...options,
  })
}

export function useAdminUser(id: number, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.admin.users.byId(id),
    queryFn: () => adminService.getUserById(id),
    enabled: !!id,
    ...options,
  })
}

export function useUpdateAdminUser(options?: UseMutationOptions<AxiosResponse, AxiosError, { id: number; data: any }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => adminService.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.users.byId(variables.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.users.all })
    },
    ...options,
  })
}

export function useAdminBulkAction(options?: UseMutationOptions<AxiosResponse, AxiosError, { user_ids: number[]; action: string; reason?: string }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => adminService.bulkAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.users.all })
    },
    ...options,
  })
}

/**
 * RBAC Hooks
 */
export function usePermissions(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.rbac.permissions.all,
    queryFn: () => rbacService.getPermissions(),
    staleTime: 1000 * 60 * 5,
    ...options,
  })
}

export function useRolePermissions(role: string, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.rbac.roles.permissions(role),
    queryFn: () => rbacService.getRolePermissions(role),
    enabled: !!role,
    ...options,
  })
}

export function useGrantPermission(options?: UseMutationOptions<AxiosResponse, AxiosError, { user_id: number; permission_id: number; reason?: string; expires_at?: string }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => rbacService.grantPermission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rbac.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.users.all })
    },
    ...options,
  })
}

export function useRevokePermission(options?: UseMutationOptions<AxiosResponse, AxiosError, { user_id: number; permission_id: number; reason?: string }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => rbacService.revokePermission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rbac.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.users.all })
    },
    ...options,
  })
}

/**
 * Audit Hooks
 */
export function useAuditLogs(params?: any, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  const queryString = params ? JSON.stringify(params) : ''
  return useQuery({
    queryKey: QUERY_KEYS.audit.logs(queryString),
    queryFn: () => auditService.getLogs(params),
    ...options,
  })
}

export function useAuditStatistics(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.audit.statistics,
    queryFn: () => auditService.getStatistics(),
    ...options,
  })
}

export function useAuditCompliance(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.audit.compliance,
    queryFn: () => auditService.getCompliance(),
    ...options,
  })
}

/**
 * Backup Hooks
 */
export function useBackups(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.backup.list,
    queryFn: () => backupService.listBackups(),
    ...options,
  })
}

export function useBackup(id: number | string, options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.backup.byId(id),
    queryFn: () => backupService.getBackupById(id),
    enabled: !!id,
    ...options,
  })
}

export function useRPOStatus(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.backup.rpoStatus,
    queryFn: () => backupService.getRPOStatus(),
    refetchInterval: 60000,
    ...options,
  })
}

export function useCreateBackup(options?: UseMutationOptions<AxiosResponse, AxiosError, { backup_type?: string; verify_after_creation?: boolean }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => backupService.createBackup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.backup.list })
    },
    ...options,
  })
}

export function useRestoreBackup(options?: UseMutationOptions<AxiosResponse, AxiosError, { backup_id: string; verify_before_restore?: boolean; create_backup_before_restore?: boolean }>) {
  return useMutation({
    mutationFn: (data) => backupService.restoreBackup(data),
    ...options,
  })
}

/**
 * GDPR Hooks
 */
export function useGDPRConsentStatus(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.gdpr.consentStatus,
    queryFn: () => gdprService.getConsentStatus(),
    ...options,
  })
}

export function useGDPRRetentionReport(options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: QUERY_KEYS.gdpr.retentionReport,
    queryFn: () => gdprService.getRetentionReport(),
    ...options,
  })
}

export function useRequestDataExport(options?: UseMutationOptions<AxiosResponse, AxiosError, 'json' | 'csv'>) {
  return useMutation({
    mutationFn: (format) => gdprService.requestDataExport(format),
    ...options,
  })
}

export function useRequestDataDeletion(options?: UseMutationOptions<AxiosResponse, AxiosError, { anonymize?: boolean; reason?: string; verification_code?: string }>) {
  return useMutation({
    mutationFn: (data) => gdprService.requestDataDeletion(data),
    ...options,
  })
}

export function useGiveConsent(options?: UseMutationOptions<AxiosResponse, AxiosError, { consent_type: string; consent_given: boolean; consent_version?: string }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => gdprService.giveConsent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gdpr.consentStatus })
    },
    ...options,
  })
}
