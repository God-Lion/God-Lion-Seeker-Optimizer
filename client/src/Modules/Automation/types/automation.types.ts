export interface AutomationConfig {
  id: string
  name: string
  enabled: boolean
  profileId: string
  criteria: ApplicationCriteria
  schedule: ScheduleSettings
  limits: ApplicationLimits
  createdAt: string
  updatedAt: string
  lastRunAt?: string
  nextRunAt?: string
}

export interface ApplicationCriteria {
  jobTitles: string[]
  keywords: string[]
  excludeKeywords: string[]
  locations: string[]
  salaryRange?: {
    min?: number
    max?: number
    currency: string
  }
  experienceLevel: ExperienceLevel[]
  jobTypes: JobType[]
  companyPreferences?: {
    include: string[]
    exclude: string[]
  }
  minMatchScore?: number
}

export type ExperienceLevel = 
  | 'entry_level'
  | 'associate'
  | 'mid_senior'
  | 'director'
  | 'executive'

export type JobType = 
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'temporary'
  | 'internship'

export interface ScheduleSettings {
  frequency: 'daily' | 'weekly' | 'custom'
  daysOfWeek?: number[] // 0-6 (Sunday-Saturday)
  timeSlots: TimeSlot[]
  timezone: string
}

export interface TimeSlot {
  start: string // HH:mm format
  end: string   // HH:mm format
}

export interface ApplicationLimits {
  maxPerDay: number
  maxPerSession: number
  minTimeBetweenApplications: number // minutes
}

export interface AutomationStats {
  totalRuns: number
  successfulApplications: number
  failedApplications: number
  averageSuccessRate: number
  lastRunStatus: 'success' | 'failed' | 'partial'
  jobsScanned: number
  jobsMatched: number
}

export interface ApplicationHistoryItem {
  id: string
  configId: string
  jobId: string
  jobTitle: string
  company: string
  appliedAt: string
  status: 'success' | 'failed' | 'pending'
  error?: string
  matchScore: number
}

export interface AutomationRun {
  id: string
  configId: string
  startedAt: string
  completedAt?: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  stats: {
    jobsScanned: number
    jobsMatched: number
    applicationsSubmitted: number
    applicationsFailed: number
  }
  errors?: string[]
}
