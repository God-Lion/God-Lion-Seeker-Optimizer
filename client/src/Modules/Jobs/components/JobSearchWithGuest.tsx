/**
 * Enhanced Jobs Search Page with Guest Mode Support
 * 
 * Features for guests:
 * - Read-only access to job listings
 * - Limited results (first 10 jobs)
 * - No delete/edit buttons
 * - "Sign up to apply" CTAs
 * - Guest mode banner
 */

import React, { useState } from 'react'
import { Box, Alert, Button, Chip, Stack, Typography, Container } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { GuestBanner, FeatureLockedModal } from 'src/components/common'
import { useGuest } from 'src/store'
import LockIcon from '@mui/icons-material/Lock'
import WorkIcon from '@mui/icons-material/Work'

interface JobSearchWithGuestProps {
  // Add your existing job search props here
  jobs?: any[]
  loading?: boolean
  onDelete?: (jobId: string) => void
  onEdit?: (jobId: string) => void
  children?: React.ReactNode
}

/**
 * Job Search Wrapper Component with Guest Mode Support
 * 
 * Wraps the existing job search functionality and adds:
 * - Guest mode restrictions
 * - Feature locked modals
 * - Limited results for guests
 */
export const JobSearchWithGuest: React.FC<JobSearchWithGuestProps> = ({
  jobs = [],
  loading = false,
  onDelete,
  onEdit,
  children,
}) => {
  const { isGuest } = useGuest()
  const navigate = useNavigate()
  const [showFeatureLocked, setShowFeatureLocked] = useState(false)
  const [lockedFeature, setLockedFeature] = useState({ name: '', description: '' })

  // Guest limitation: Show only first 10 jobs
  const GUEST_JOB_LIMIT = 10
  const displayJobs = isGuest ? jobs.slice(0, GUEST_JOB_LIMIT) : jobs

  const handleGuestAction = (action: string) => {
    setLockedFeature({
      name: action,
      description: `The ${action} feature requires an account. Sign up for free to unlock full job search capabilities!`,
    })
    setShowFeatureLocked(true)
  }

  const handleApplyClick = () => {
    if (isGuest) {
      handleGuestAction('Apply to Jobs')
    } else {
      // Handle authenticated user apply logic
      console.log('Applying to job...')
    }
  }

  const handleDeleteClick = (jobId: string) => {
    if (isGuest) {
      handleGuestAction('Delete Jobs')
    } else if (onDelete) {
      onDelete(jobId)
    }
  }

  const handleEditClick = (jobId: string) => {
    if (isGuest) {
      handleGuestAction('Edit Jobs')
    } else if (onEdit) {
      onEdit(jobId)
    }
  }

  return (
    <Box>
      {/* Guest Banner */}
      {isGuest && (
        <Container maxWidth="lg" sx={{ pt: 3 }}>
          <GuestBanner
            variant="minimal"
            message="You're viewing jobs as a guest. Sign up to apply, save jobs, and track applications!"
          />

          {/* Results Limitation Notice */}
          {jobs.length > GUEST_JOB_LIMIT && (
            <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">
                    <strong>Limited Results:</strong> Showing {GUEST_JOB_LIMIT} of {jobs.length} jobs.
                    Sign up to see all results and unlock advanced search features!
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<LockIcon />}
                  onClick={() => navigate('/auth/signup')}
                >
                  Unlock All Jobs
                </Button>
              </Stack>
            </Alert>
          )}
        </Container>
      )}

      {/* Main Content - Pass guest restrictions to children */}
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            jobs: displayJobs,
            isGuest,
            onApply: handleApplyClick,
            onDelete: handleDeleteClick,
            onEdit: handleEditClick,
            showGuestRestrictions: true,
          })
        }
        return child
      })}

      {/* Feature Locked Modal */}
      <FeatureLockedModal
        open={showFeatureLocked}
        onClose={() => setShowFeatureLocked(false)}
        featureName={lockedFeature.name}
        featureDescription={lockedFeature.description}
        benefits={[
          'Apply to unlimited jobs',
          'Save jobs for later',
          'Track your applications',
          'Get job alerts',
          'Access advanced filters',
          'Export job listings',
        ]}
      />
    </Box>
  )
}

export default JobSearchWithGuest
