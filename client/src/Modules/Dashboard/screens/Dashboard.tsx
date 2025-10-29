import React, { useEffect, useState } from 'react'
import { Box, Typography, Alert, CircularProgress } from '@mui/material'
import Grid from 'src/components/Grid'
import { useAppStore } from 'src/store'
import {
  ApplicationsOverview,
  InterviewSchedule,
  SavedJobs,
  RecentActivity,
  QuickActions,
  ProfileCompletionWidget,
  ApplicationStats,
  Interview,
  SavedJob,
  Activity,
  ProfileSection,
} from '../components'

// Mock data - Replace with actual API calls
const mockApplicationStats: ApplicationStats = {
  total: 45,
  pending: 12,
  accepted: 8,
  rejected: 15,
  interviews: 10,
}

const mockInterviews: Interview[] = [
  {
    id: '1',
    company: 'Google',
    position: 'Senior Software Engineer',
    date: 'Today',
    time: '2:00 PM',
    type: 'video',
    status: 'today',
    companyLogo: '',
  },
  {
    id: '2',
    company: 'Microsoft',
    position: 'Product Manager',
    date: 'Tomorrow',
    time: '10:00 AM',
    type: 'in-person',
    status: 'upcoming',
  },
  {
    id: '3',
    company: 'Amazon',
    position: 'Data Scientist',
    date: 'Dec 28',
    time: '3:30 PM',
    type: 'phone',
    status: 'upcoming',
  },
]

const mockSavedJobs: SavedJob[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'Tesla',
    location: 'Palo Alto, CA',
    type: 'Full-time',
    salary: '$120k - $180k',
    postedDate: '2025-10-20',
    saved: true,
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    company: 'Apple',
    location: 'Cupertino, CA',
    type: 'Full-time',
    salary: '$140k - $200k',
    postedDate: '2025-10-22',
    saved: true,
  },
  {
    id: '3',
    title: 'React Developer',
    company: 'Meta',
    location: 'Menlo Park, CA',
    type: 'Contract',
    salary: '$90/hr',
    postedDate: '2025-10-23',
    saved: true,
  },
]

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'application',
    title: 'Applied to Google',
    description: 'Senior Software Engineer position',
    timestamp: '2025-10-24T10:30:00',
    metadata: { company: 'Google', status: 'pending' },
  },
  {
    id: '2',
    type: 'interview',
    title: 'Interview Scheduled',
    description: 'Product Manager at Microsoft',
    timestamp: '2025-10-24T09:15:00',
    metadata: { company: 'Microsoft', status: 'upcoming' },
  },
  {
    id: '3',
    type: 'saved',
    title: 'Saved Job',
    description: 'Senior Frontend Developer at Tesla',
    timestamp: '2025-10-23T16:45:00',
  },
  {
    id: '4',
    type: 'profile_update',
    title: 'Profile Updated',
    description: 'Added new skills and certifications',
    timestamp: '2025-10-23T14:20:00',
  },
  {
    id: '5',
    type: 'document_upload',
    title: 'Resume Uploaded',
    description: 'Updated resume for software engineering roles',
    timestamp: '2025-10-22T11:00:00',
  },
]

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State for dashboard data
  const [applicationStats] = useState<ApplicationStats>(mockApplicationStats)
  const [interviews] = useState<Interview[]>(mockInterviews)
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>(mockSavedJobs)
  const [activities] = useState<Activity[]>(mockActivities)
  const [profileSections] = useState<ProfileSection[]>(mockProfileSections)

  useEffect(() => {
    // Fetch dashboard data
    fetchDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // TODO: Replace with actual API calls
      // const [statsRes, interviewsRes, jobsRes, activitiesRes, profileRes] = await Promise.all([
      //   applicationService.getStats(),
      //   interviewService.getUpcoming(),
      //   jobService.getSaved(),
      //   activityService.getRecent(),
      //   profileService.getCompletion(),
      // ])
      
      // For now, using mock data
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSaveJob = (jobId: string) => {
    setSavedJobs(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, saved: !job.saved } : job
      )
    )
  }

  const handleCompleteProfileSection = (sectionId: string) => {
    // Navigate to profile completion page or open modal
    console.log('Complete section:', sectionId)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 1 }}>
          Welcome back, {user?.user?.firstName || user?.user?.email || 'User'}! 👋
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Here's what's happening with your job search
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Dashboard Grid */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            {/* Applications Overview */}
            <Grid item xs={12}>
              <ApplicationsOverview stats={applicationStats} loading={loading} />
            </Grid>

            {/* Interview Schedule */}
            <Grid item xs={12} md={6}>
              <InterviewSchedule
                interviews={interviews}
                loading={loading}
                onViewAll={() => console.log('View all interviews')}
              />
            </Grid>

            {/* Saved Jobs */}
            <Grid item xs={12} md={6}>
              <SavedJobs
                jobs={savedJobs}
                loading={loading}
                onToggleSave={handleToggleSaveJob}
                onViewAll={() => console.log('View all saved jobs')}
              />
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12}>
              <RecentActivity activities={activities} loading={loading} />
            </Grid>
          </Grid>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* Quick Actions */}
            <Grid item xs={12}>
              <QuickActions onActionClick={(id) => console.log('Action clicked:', id)} />
            </Grid>

            {/* Profile Completion */}
            <Grid item xs={12}>
              <ProfileCompletionWidget
                sections={profileSections}
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
