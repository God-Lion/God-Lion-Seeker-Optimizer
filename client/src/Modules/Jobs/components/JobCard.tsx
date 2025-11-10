// src/Modules/Jobs/components/JobCard.tsx
import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Button,
  Tooltip,
} from '@mui/material'
import { Job } from 'src/types/job'

interface JobCardProps {
  job: Job
  onSave: (job: Job) => void
  onUnsave: (jobId: number) => void
  onApply: (job: Job) => void
  isSaved: boolean
  onViewDetails: () => void
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  onSave,
  onUnsave,
  onApply,
  isSaved,
  onViewDetails,
}) => {
  return (
    <Card
      sx={{
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 8,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 1, cursor: 'pointer' }} onClick={onViewDetails}>
              {job.title}
            </Typography>
            <Typography
              variant='body2'
              sx={{ color: 'text.secondary', mb: 1 }}
            >
              {job.company_name}
            </Typography>
            <Typography
              variant='body2'
              sx={{ color: 'text.secondary', mb: 2 }}
            >
              📍 {job.location}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant='body2' sx={{ mb: 1 }}>
                {job.description?.substring(0, 200)}
                {job.description && job.description.length > 200 && '...'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {job.job_type && <Chip label={job.job_type} size='small' />}
              {job.experience_level && (
                <Chip label={job.experience_level} size='small' />
              )}
              {job.salary_range && (
                <Chip label={job.salary_range} size='small' color='success' />
              )}
              {job.posted_date && (
                <Chip
                  label={`Posted: ${new Date(
                    job.posted_date,
                  ).toLocaleDateString()}`}
                  size='small'
                  variant='outlined'
                />
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
            {job.match_score && (
              <Tooltip title='Match Score'>
                <Chip
                  label={`${job.match_score}%`}
                  color='primary'
                  variant='filled'
                />
              </Tooltip>
            )}
            <Button
              variant='outlined'
              size='small'
              onClick={onViewDetails}
            >
              View Details
            </Button>
            <Button
              variant={isSaved ? 'outlined' : 'contained'}
              size='small'
              onClick={() => (isSaved ? onUnsave(job.id) : onSave(job))}
            >
              {isSaved ? 'Unsave' : 'Save'}
            </Button>
            <Button
              variant='contained'
              color='secondary'
              size='small'
              onClick={() => onApply(job)}
            >
              Apply
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default JobCard
