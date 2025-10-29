import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Button,
  Stack,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import WorkIcon from '@mui/icons-material/Work'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import MoreVertIcon from '@mui/icons-material/MoreVert'

export interface SavedJob {
  id: string
  title: string
  company: string
  location: string
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship'
  salary?: string
  postedDate: string
  companyLogo?: string
  saved: boolean
}

interface SavedJobsProps {
  jobs: SavedJob[]
  loading?: boolean
  onToggleSave?: (jobId: string) => void
  onViewAll?: () => void
}

export const SavedJobs: React.FC<SavedJobsProps> = ({
  jobs,
  loading = false,
  onToggleSave,
  onViewAll,
}) => {
  const theme = useTheme()

  const getJobTypeColor = (type: SavedJob['type']) => {
    switch (type) {
      case 'Full-time':
        return theme.palette.success.main
      case 'Part-time':
        return theme.palette.info.main
      case 'Contract':
        return theme.palette.warning.main
      case 'Internship':
        return theme.palette.secondary.main
      default:
        return theme.palette.grey[500]
    }
  }

  const formatPostedDate = (date: string) => {
    const now = new Date()
    const posted = new Date(date)
    const diffTime = Math.abs(now.getTime() - posted.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
            Saved Jobs
          </Typography>
          {onViewAll && (
            <Button size='small' onClick={onViewAll}>
              View All
            </Button>
          )}
        </Box>

        {jobs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <BookmarkBorderIcon sx={{ fontSize: 48, color: theme.palette.grey[300], mb: 2 }} />
            <Typography variant='body2' color='text.secondary'>
              No saved jobs yet
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              Save jobs you're interested in to view them here
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {jobs.slice(0, 5).map((job, index) => (
              <React.Fragment key={job.id}>
                <ListItem
                  sx={{
                    px: 0,
                    py: 2,
                    borderRadius: 2,
                    transition: 'background-color 0.2s',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        edge='end'
                        size='small'
                        onClick={() => onToggleSave?.(job.id)}
                        sx={{ color: job.saved ? theme.palette.warning.main : theme.palette.action.disabled }}
                      >
                        {job.saved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                      </IconButton>
                      <IconButton edge='end' size='small'>
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      src={job.companyLogo}
                      variant='rounded'
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: theme.palette.primary.main,
                      }}
                    >
                      {job.company[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    sx={{ pr: 8 }}
                    primary={
                      <Box sx={{ mb: 0.5 }}>
                        <Typography variant='subtitle2' sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          {job.title}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {job.company}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Stack spacing={0.5} sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOnIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                            <Typography variant='caption' color='text.secondary'>
                              {job.location}
                            </Typography>
                          </Box>
                          <Chip
                            size='small'
                            label={job.type}
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              backgroundColor: getJobTypeColor(job.type),
                              color: '#fff',
                            }}
                          />
                          {job.salary && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <WorkIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                              <Typography variant='caption' color='text.secondary'>
                                {job.salary}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTimeIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                          <Typography variant='caption' color='text.secondary'>
                            {formatPostedDate(job.postedDate)}
                          </Typography>
                        </Box>
                      </Stack>
                    }
                  />
                </ListItem>
                {index < Math.min(jobs.length, 5) - 1 && (
                  <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}` }} />
                )}
              </React.Fragment>
            ))}
          </List>
        )}

        {jobs.length > 5 && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant='caption' color='text.secondary'>
              +{jobs.length - 5} more saved jobs
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default SavedJobs
