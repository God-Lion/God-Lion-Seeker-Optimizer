// src/Modules/Jobs/screens/JobDetails.tsx

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
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useJob } from '../hooks/useJobsQuery' // Assuming this hook exists

interface JobDetailsProps {
  jobId: number | null
  open: boolean
  onClose: () => void
}

const JobDetails: React.FC<JobDetailsProps> = ({ jobId, open, onClose }) => {
  const { data, isLoading, error } = useJob(jobId, {
    enabled: open && !!jobId,
  })

  const job = data?.data

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth scroll='paper'>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Job Details
        <IconButton aria-label='close' onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent dividers>
        {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>}
        {error && <Alert severity='error'>{error.message || 'Failed to load job details'}</Alert>}
        {job && !isLoading && (
          <Box>
            <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 2 }}>
              {job.title}
            </Typography>
            <Typography variant='h6' sx={{ color: 'text.secondary', mb: 2 }}>
              {job.company_name}
            </Typography>
            <Typography variant='body1' sx={{ mb: 3 }}>
              📍 {job.location}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              {job.job_type && <Chip label={job.job_type} color='primary' />}
              {job.experience_level && <Chip label={job.experience_level} color='secondary' />}
              {job.salary_range && <Chip label={job.salary_range} color='success' />}
              {job.posted_date && <Chip label={`Posted: ${new Date(job.posted_date).toLocaleDateString()}`} variant='outlined' />}
            </Box>
            <Divider sx={{ my: 3 }} />
            <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 2 }}>
              Description
            </Typography>
            <Typography variant='body1' sx={{ whiteSpace: 'pre-line' }}>
              {job.description}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant='contained' color='primary' onClick={() => alert('Customize Resume CTA clicked!')}>
          Customize Resume
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default JobDetails
