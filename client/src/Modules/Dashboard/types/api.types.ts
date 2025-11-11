// ============================================================================
// Dashboard Module - API Type Definitions
// ============================================================================

// ============================================================================
// Core Entity Types
// ============================================================================

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  applications_count: number
  interviews_scheduled: number
  saved_jobs: number
  profile_views: number
}

/**
 * Recent application item
 */
export interface RecentApplication {
  id: number
  job_title: string
  company_name: string
  status: string
  applied_at: string
}

/**
 * Upcoming interview item
 */
export interface UpcomingInterview {
  id: number
  job_title: string
  company_name: string
  scheduled_at: string
  type: string
}

/**
 * Job recommendation item
 */
export interface JobRecommendation {
  id: number
  job_title: string
  company_name: string
  location: string
  match_score: number
  posted_date: string | null
}

/**
 * Recent activity item
 */
export interface RecentActivity {
  type: string
  description: string
  timestamp: string
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Dashboard overview response with all data
 */
export interface DashboardOverviewResponse {
  stats: DashboardStats
  recent_applications: RecentApplication[]
  upcoming_interviews: UpcomingInterview[]
  recommendations: JobRecommendation[]
  recent_activity: RecentActivity[]
}

/**
 * Dashboard stats-only response
 */
export interface DashboardStatsResponse {
  applications_count: number
  interviews_scheduled: number
  saved_jobs: number
  profile_views: number
}

/**
 * Recent applications response
 */
export type RecentApplicationsResponse = RecentApplication[]

/**
 * Job recommendations response
 */
export type JobRecommendationsResponse = JobRecommendation[]

// ============================================================================
// Request Parameter Types
// ============================================================================

/**
 * Parameters for fetching recent applications
 */
export interface RecentApplicationsParams {
  limit?: number
}

/**
 * Parameters for fetching job recommendations
 */
export interface RecommendationsParams {
  limit?: number
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Dashboard view mode
 */
export type DashboardViewMode = 'overview' | 'applications' | 'recommendations'

/**
 * Dashboard filter state
 */
export interface DashboardFilters {
  dateRange?: {
    start: Date
    end: Date
  }
  status?: string[]
}

/**
 * Dashboard sort configuration
 */
export interface DashboardSort {
  field: 'date' | 'status' | 'company'
  direction: 'asc' | 'desc'
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Stats card props
 */
export interface StatsCardProps {
  title: string
  value: number
  icon: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  loading?: boolean
}

/**
 * Application card props
 */
export interface ApplicationCardProps {
  application: RecentApplication
  onClick?: (id: number) => void
}

/**
 * Recommendation card props
 */
export interface RecommendationCardProps {
  recommendation: JobRecommendation
  onSave?: (id: number) => void
  onApply?: (id: number) => void
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Loading state for different dashboard sections
 */
export interface DashboardLoadingState {
  overview: boolean
  stats: boolean
  applications: boolean
  recommendations: boolean
}

/**
 * Error state for different dashboard sections
 */
export interface DashboardErrorState {
  overview: string | null
  stats: string | null
  applications: string | null
  recommendations: string | null
}
