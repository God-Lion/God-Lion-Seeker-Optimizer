// src/Modules/JobsManagement/screens/JobDetailsPage.tsx

import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Link,
  Breadcrumbs,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useParams, useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import DeleteIcon from '@mui/icons-material/Delete'
import { useJob, useDeleteJob } from '../hooks'
import AutomatedSubmissionButton from 'src/Modules/ApplicationSubmission/components/AutomatedSubmissionButton'
import SubmissionStatusModal from 'src/Modules/ApplicationSubmission/components/SubmissionStatusModal'
import { useAutomatedSubmission } from 'src/Modules/ApplicationSubmission/hooks/useAutomatedSubmission'
import { useSubmissionStore } from 'src/Modules/ApplicationSubmission/store/useSubmissionStore'
import { toast } from 'react-toastify'

const JobDetailsPage: React.FC = (): React.ReactElement => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const jobId = id ? parseInt(id, 10) : null

  // Fetch job details
  const { data, isLoading, error } = useJob(jobId)
  const job = data?.data

  // Delete mutation
  const deleteMutation = useDeleteJob({
    onSuccess: () => {
      navigate('/jobs')
    },
  })

  const {
    isModalOpen,
    submissionStatus,
    openModal,
    closeModal,
    setSubmissionStatus,
  } = useSubmissionStore()

  const { mutate: startSubmission, isPending: isSubmitting } = useAutomatedSubmission()

  const handleSubmissionStart = () => {
    if (!job) return;

    openModal()
    setSubmissionStatus('loading')
    startSubmission(job.id, {
      onSuccess: () => {
        setSubmissionStatus('success')
        toast.success('Application submitted successfully!')
      },
      onError: () => {
        setSubmissionStatus('error')
        toast.error('Failed to submit application.')
      },
    })
  }

  /**
   * Handle job deletion
   */
  const handleDelete = async () => {
    if (job && window.confirm('Are you sure you want to delete this job?')) {
      try {
        await deleteMutation.mutateAsync({ jobId: job.id })
      } catch (error) {
        console.error('Failed to delete job:', error)
      }
    }
  }

  /**
   * Go back to jobs list
   */
  const handleGoBack = () => {
    navigate('/jobs')
  }

  return (
    <Box>
      <SubmissionStatusModal
        isOpen={isModalOpen}
        onClose={closeModal}
        submissionState={submissionStatus}
      />
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component='button'
          variant='body1'
          onClick={handleGoBack}
          sx={{ cursor: 'pointer' }}
        >
          Jobs
        </Link>
        <Typography color='text.primary'>
          {job?.title || 'Job Details'}
        </Typography>
      </Breadcrumbs>

      {/* Header Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
        >
          Back to Jobs
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {job?.job_url && (
            <Button
              variant='contained'
              color='primary'
              href={job.job_url}
              target='_blank'
              rel='noopener noreferrer'
              startIcon={<OpenInNewIcon />}
            >
              Apply on Site
            </Button>
          )}
          {job && (
            <AutomatedSubmissionButton
              onClick={handleSubmissionStart}
              isLoading={isSubmitting}
            />
          )}
          {job && (
            <Button
              variant='outlined'
              color='error'
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          )}
        </Box>
      </Box>

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress size={60} />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error.message || 'Failed to load job details'}
        </Alert>
      )}

      {/* Job Content */}
      {job && !isLoading && (
        <Card
          sx={{
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[3],
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Job Title */}
            <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 2 }}>
              {job.title}
            </Typography>

            {/* Company Name */}
            <Typography variant='h5' sx={{ color: 'text.secondary', mb: 2 }}>
              {job.company_name}
            </Typography>

            {/* Location */}
            <Typography variant='h6' sx={{ mb: 3 }}>
              📍 {job.location}
            </Typography>

            {/* Job Metadata */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 4 }}>
              {job.job_type && (
                <Chip label={job.job_type} color='primary' size='medium' />
              )}
              {job.experience_level && (
                <Chip label={job.experience_level} color='secondary' size='medium' />
              )}
              {job.salary_range && (
                <Chip label={job.salary_range} color='success' size='medium' />
              )}
              {job.posted_date && (
                <Chip 
                  label={`Posted: ${new Date(job.posted_date).toLocaleDateString()}`} 
                  variant='outlined'
                  size='medium'
                />
              )}
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Job Description */}
            <Box sx={{ mb: 4 }}>
              <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 2 }}>
                Description
              </Typography>
              <Typography variant='body1' sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                {job.description}
              </Typography>
            </Box>

            {/* Requirements */}
            {job.requirements && (
              <Box sx={{ mb: 4 }}>
                <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 2 }}>
                  Requirements
                </Typography>
                <Typography variant='body1' sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                  {job.requirements}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 4 }} />

            {/* Additional Information */}
            <Box>
              <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 3 }}>
                Additional Information
              </Typography>
              
              <Box sx={{ display: 'grid', gap: 2 }}>
                {job.job_url && (
                  <Box>
                    <Typography variant='body2' sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 'bold' }}>
                      Job URL:
                    </Typography>
                    <Link
                      href={job.job_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      {job.job_url}
                      <OpenInNewIcon sx={{ fontSize: 16 }} />
                    </Link>
                  </Box>
                )}

                {job.external_id && (
                  <Box>
                    <Typography variant='body2' sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 'bold' }}>
                      External ID:
                    </Typography>
                    <Typography variant='body1'>
                      {job.external_id}
                    </Typography>
                  </Box>
                )}

                {job.scraped_at && (
                  <Box>
                    <Typography variant='body2' sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 'bold' }}>
                      Scraped At:
                    </Typography>
                    <Typography variant='body1'>
                      {new Date(job.scraped_at).toLocaleString()}
                    </Typography>
                  </Box>
                )}

                {job.created_at && (
                  <Box>
                    <Typography variant='body2' sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 'bold' }}>
                      Added to Database:
                    </Typography>
                    <Typography variant='body1'>
                      {new Date(job.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                )}

                {job.updated_at && (
                  <Box>
                    <Typography variant='body2' sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 'bold' }}>
                      Last Updated:
                    </Typography>
                    <Typography variant='body1'>
                      {new Date(job.updated_at).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default JobDetailsPage
