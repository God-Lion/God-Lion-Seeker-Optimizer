import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import WorkIcon from '@mui/icons-material/Work'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import SendIcon from '@mui/icons-material/Send'
import ScheduleIcon from '@mui/icons-material/Schedule'
import DescriptionIcon from '@mui/icons-material/Description'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

export interface Activity {
  id: string
  type: 'application' | 'saved' | 'interview' | 'profile_update' | 'document_upload' | 'job_scrape'
  title: string
  description: string
  timestamp: string
  metadata?: {
    company?: string
    position?: string
    status?: string
  }
}

interface RecentActivityProps {
  activities: Activity[]
  loading?: boolean
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  loading = false,
}) => {
  const theme = useTheme()

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'application':
        return <SendIcon sx={{ fontSize: 20 }} />
      case 'saved':
        return <BookmarkIcon sx={{ fontSize: 20 }} />
      case 'interview':
        return <ScheduleIcon sx={{ fontSize: 20 }} />
      case 'profile_update':
        return <PersonAddIcon sx={{ fontSize: 20 }} />
      case 'document_upload':
        return <DescriptionIcon sx={{ fontSize: 20 }} />
      case 'job_scrape':
        return <WorkIcon sx={{ fontSize: 20 }} />
      default:
        return <CheckCircleIcon sx={{ fontSize: 20 }} />
    }
  }

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'application':
        return theme.palette.primary.main
      case 'saved':
        return theme.palette.warning.main
      case 'interview':
        return theme.palette.success.main
      case 'profile_update':
        return theme.palette.info.main
      case 'document_upload':
        return theme.palette.secondary.main
      case 'job_scrape':
        return theme.palette.error.main
      default:
        return theme.palette.grey[500]
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const now = new Date()
    const activityTime = new Date(timestamp)
    const diffMs = now.getTime() - activityTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return activityTime.toLocaleDateString()
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 2 }}>
          Recent Activity
        </Typography>

        {activities.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <WorkIcon sx={{ fontSize: 48, color: theme.palette.grey[300], mb: 2 }} />
            <Typography variant='body2' color='text.secondary'>
              No recent activity
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {activities
              .filter(activity => activity)
              .slice(0, 8)
              .map((activity, index) => (
              <Box key={activity.id}>
                <ListItem
                  sx={{
                    px: 0,
                    py: 1.5,
                    borderRadius: 1,
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 48 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: `${getActivityColor(activity.type)}20`,
                        color: getActivityColor(activity.type),
                      }}
                    >
                      {getActivityIcon(activity.type)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant='body2' sx={{ fontWeight: 500 }}>
                          {activity.title}
                        </Typography>
                        {activity.metadata?.status && (
                          <Chip
                            size='small'
                            label={activity.metadata.status}
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                          {activity.description}
                        </Typography>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}
                        >
                          {formatTimestamp(activity.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < Math.min(activities.length, 8) - 1 && (
                  <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, ml: 6 }} />
                )}
              </Box>
            ))}
          </List>
        )}

        {activities.length > 8 && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant='caption' color='text.secondary'>
              +{activities.length - 8} more activities
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentActivity
