// src/Modules/JobsManagement/screens/JobDetails.tsx

import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Link,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { useJob } from '../hooks'

interface JobDetailsProps {
  jobId: number | null
  open: boolean
  onClose: () => void
}

const JobDetails: React.FC<JobDetailsProps> = ({ jobId, open, onClose }) => {
  // Use the query hook to fetch job details
  const { data, isLoading, error } = useJob(jobId, {
    enabled: open && !!jobId,
  })

  const job = data?.data

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      scroll='paper'
    >
      {/* Dialog Title */}
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='h6' component='div'>
          Job Details
        </Typography>
        <IconButton
          aria-label='close'
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/* Dialog Content */}
      <DialogContent dividers>
        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity='error'>
            {error.message || 'Failed to load job details'}
          </Alert>
        )}

        {/* Job Content */}
        {job && !isLoading && (
          <Box>
            {/* Job Title */}
            <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 2 }}>
              {job.title}
            </Typography>

            {/* Company Name */}
            <Typography variant='h6' sx={{ color: 'text.secondary', mb: 2 }}>
              {job.company_name}
            </Typography>

            {/* Location */}
            <Typography variant='body1' sx={{ mb: 3 }}>
              📍 {job.location}
            </Typography>

            {/* Job Metadata */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              {job.job_type && (
                <Chip label={job.job_type} color='primary' />
              )}
              {job.experience_level && (
                <Chip label={job.experience_level} color='secondary' />
              )}
              {job.salary_range && (
                <Chip label={job.salary_range} color='success' />
              )}
              {job.posted_date && (
                <Chip 
                  label={`Posted: ${new Date(job.posted_date).toLocaleDateString()}`} 
                  variant='outlined'
                />
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Job Description */}
            <Box sx={{ mb: 3 }}>
              <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 2 }}>
                Description
              </Typography>
              <Typography variant='body1' sx={{ whiteSpace: 'pre-line' }}>
                {job.description}
              </Typography>
            </Box>

            {/* Requirements */}
            {job.requirements && (
              <Box sx={{ mb: 3 }}>
                <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 2 }}>
                  Requirements
                </Typography>
                <Typography variant='body1' sx={{ whiteSpace: 'pre-line' }}>
                  {job.requirements}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Additional Information */}
            <Box>
              <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 2 }}>
                Additional Information
              </Typography>
              
              {job.job_url && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant='body2' sx={{ color: 'text.secondary', mb: 0.5 }}>
                    Job URL:
                  </Typography>
                  <Link
                    href={job.job_url}
                    target='_blank'
                    rel='noopener noreferrer'
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    View Original Posting
                    <OpenInNewIcon sx={{ fontSize: 16 }} />
                  </Link>
                </Box>
              )}

              {job.external_id && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant='body2' sx={{ color: 'text.secondary', mb: 0.5 }}>
                    External ID:
                  </Typography>
                  <Typography variant='body2'>
                    {job.external_id}
                  </Typography>
                </Box>
              )}

              {job.scraped_at && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant='body2' sx={{ color: 'text.secondary', mb: 0.5 }}>
                    Scraped At:
                  </Typography>
                  <Typography variant='body2'>
                    {new Date(job.scraped_at).toLocaleString()}
                  </Typography>
                </Box>
              )}

              {job.created_at && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant='body2' sx={{ color: 'text.secondary', mb: 0.5 }}>
                    Added to Database:
                  </Typography>
                  <Typography variant='body2'>
                    {new Date(job.created_at).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions>
        <Button onClick={onClose} color='primary'>
          Close
        </Button>
        {job?.job_url && (
          <Button
            href={job.job_url}
            target='_blank'
            rel='noopener noreferrer'
            variant='contained'
            color='primary'
            startIcon={<OpenInNewIcon />}
          >
            Apply on Site
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default JobDetails
