/**
 * Dashboard Screen
 * 
 * Main dashboard view displaying:
 * - Application statistics
 * - Recent applications
 * - Upcoming interviews
 * - Job recommendations
 * - Recent activity
 * - Profile completion widget
 * - Quick actions
 */

import React from 'react'
import { Box, Typography, Alert, CircularProgress, Button } from '@mui/material'
import { Refresh as RefreshIcon } from '@mui/icons-material'
import Grid from 'src/components/Grid'
import { useAppStore } from 'src/store'
import { useDashboardManagement } from '../hooks'
import {
  ApplicationsOverview,
  InterviewSchedule,
  SavedJobs,
  RecentActivity,
  QuickActions,
  ProfileCompletionWidget,
} from '../components'

// Transform API data to component types
import type { ApplicationStats, Interview, SavedJob, Activity, ProfileSection } from '../components'
import type { RecentApplication, UpcomingInterview, JobRecommendation } from '../types'

/**
 * Transform recent applications to application stats
 */
const transformToApplicationStats = (
  recentApplications: RecentApplication[]
): ApplicationStats => {
  const total = recentApplications.length
  const pending = recentApplications.filter(app => app.status === 'pending').length
  const accepted = recentApplications.filter(app => app.status === 'accepted').length
  const rejected = recentApplications.filter(app => app.status === 'rejected').length
  const interviews = recentApplications.filter(app => app.status === 'interview').length

  return {
    total,
    pending,
    accepted,
    rejected,
    interviews,
  }
}

/**
 * Transform upcoming interviews from API response
 */
const transformToInterviews = (interviews: UpcomingInterview[]): Interview[] => {
  return interviews.map(interview => ({
    id: interview.id.toString(),
    company: interview.company_name,
    position: interview.job_title,
    date: new Date(interview.scheduled_at).toLocaleDateString(),
    time: new Date(interview.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: interview.type as 'video' | 'phone' | 'in-person',
    status: 'upcoming' as const,
  }))
}

/**
 * Transform job recommendations to saved jobs
 */
const transformToSavedJobs = (recommendations: JobRecommendation[]): SavedJob[] => {
  return recommendations.slice(0, 3).map(rec => ({
    id: rec.id.toString(),
    title: rec.job_title,
    company: rec.company_name,
    location: rec.location,
    type: 'Full-time',
    salary: undefined,
    postedDate: rec.posted_date || '',
    saved: true,
  }))
}

/**
 * Transform recent activity
 */
const transformToActivities = (activities: import('../types').RecentActivity[]): Activity[] => {
  return activities.map((activity, index) => ({
    id: index.toString(),
    type: activity.type as Activity['type'],
    title: activity.description,
    description: activity.description,
    timestamp: activity.timestamp,
  }))
}

// Mock profile sections - This should come from profile API in the future
const mockProfileSections: ProfileSection[] = [
  {
    id: 'basic-info',
    label: 'Basic Information',
    completed: true,
    icon: null,
  },
  {
    id: 'work-experience',
    label: 'Work Experience',
    completed: true,
    icon: null,
  },
  {
    id: 'education',
    label: 'Education',
    completed: false,
    icon: null,
  },
  {
    id: 'resume',
    label: 'Upload Resume',
    completed: true,
    icon: null,
  },
  {
    id: 'social-links',
    label: 'Social Links',
    completed: false,
    icon: null,
  },
]

const Dashboard: React.FC = (): React.ReactElement => {
  const user = useAppStore((state) => state.user)

  // Use the management hook for all dashboard operations
  const {
    data,
    stats,
    recentApplications,
    recommendations,
    recentActivity,
    isLoading,
    error,
    refreshAll,
    navigateToJob,
    navigateToProfile,
  } = useDashboardManagement(10, 10)

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleToggleSaveJob = (jobId: string) => {
    // TODO: Implement save/unsave job functionality
    console.log('Toggle save job:', jobId)
  }

  const handleCompleteProfileSection = (sectionId: string) => {
    navigateToProfile()
  }

  const handleActionClick = (actionId: string) => {
    // Handle quick action clicks
    console.log('Action clicked:', actionId)
  }

  // ============================================================================
  // Compute transformed data
  // ============================================================================

  // Default stats when no data is available
  const defaultStats: ApplicationStats = {
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    interviews: 0,
  }

  const applicationStats = recentApplications.length > 0
    ? transformToApplicationStats(recentApplications)
    : defaultStats

  const interviews = data?.upcoming_interviews 
    ? transformToInterviews(data.upcoming_interviews) 
    : []

  const savedJobs = recommendations.length > 0
    ? transformToSavedJobs(recommendations)
    : []

  const activities = recentActivity.length > 0
    ? transformToActivities(recentActivity)
    : []

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 1 }}>
            Welcome back, {user?.user?.firstName || user?.user?.email || 'User'}! 👋
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Here's what's happening with your job search
          </Typography>
        </Box>
        <Button
          variant='outlined'
          startIcon={<RefreshIcon />}
          onClick={refreshAll}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error.message || 'Failed to load dashboard data'}
        </Alert>
      )}

      {/* Dashboard Grid */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            {/* Applications Overview */}
            <Grid item xs={12}>
              <ApplicationsOverview 
                stats={applicationStats} 
                loading={isLoading} 
              />
            </Grid>

            {/* Interview Schedule */}
            <Grid item xs={12} md={6}>
              <InterviewSchedule
                interviews={interviews}
                loading={isLoading}
                onViewAll={() => console.log('View all interviews')}
              />
            </Grid>

            {/* Saved Jobs / Recommendations */}
            <Grid item xs={12} md={6}>
              <SavedJobs
                jobs={savedJobs}
                loading={isLoading}
                onToggleSave={handleToggleSaveJob}
                onViewAll={() => console.log('View all saved jobs')}
              />
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12}>
              <RecentActivity 
                activities={activities} 
                loading={isLoading} 
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* Quick Actions */}
            <Grid item xs={12}>
              <QuickActions onActionClick={handleActionClick} />
            </Grid>

            {/* Profile Completion */}
            <Grid item xs={12}>
              <ProfileCompletionWidget
                sections={mockProfileSections}
                onCompleteSection={handleCompleteProfileSection}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard
