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
  Alert,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import VideocamIcon from '@mui/icons-material/Videocam'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhoneIcon from '@mui/icons-material/Phone'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EventNoteIcon from '@mui/icons-material/EventNote'

export interface Interview {
  id: string
  company: string
  position: string
  date: string
  time: string
  type: 'video' | 'in-person' | 'phone'
  status: 'upcoming' | 'today' | 'completed'
  companyLogo?: string
}

interface InterviewScheduleProps {
  interviews: Interview[]
  loading?: boolean
  onViewAll?: () => void
}

export const InterviewSchedule: React.FC<InterviewScheduleProps> = ({
  interviews,
  loading = false,
  onViewAll,
}) => {
  const theme = useTheme()

  const getInterviewIcon = (type: Interview['type']) => {
    switch (type) {
      case 'video':
        return <VideocamIcon sx={{ fontSize: 20 }} />
      case 'in-person':
        return <LocationOnIcon sx={{ fontSize: 20 }} />
      case 'phone':
        return <PhoneIcon sx={{ fontSize: 20 }} />
      default:
        return <CalendarTodayIcon sx={{ fontSize: 20 }} />
    }
  }

  const getStatusColor = (status: Interview['status']) => {
    switch (status) {
      case 'today':
        return theme.palette.warning.main
      case 'upcoming':
        return theme.palette.info.main
      case 'completed':
        return theme.palette.success.main
      default:
        return theme.palette.grey[500]
    }
  }

  const todayInterviews = interviews.filter((i) => i.status === 'today')
  const upcomingInterviews = interviews.filter((i) => i.status === 'upcoming').slice(0, 3)

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
            Interview Schedule
          </Typography>
          {onViewAll && (
            <Button size='small' onClick={onViewAll}>
              View All
            </Button>
          )}
        </Box>

        {todayInterviews.length > 0 && (
          <Alert
            severity='warning'
            icon={<EventNoteIcon />}
            sx={{ mb: 2 }}
          >
            You have {todayInterviews.length} interview{todayInterviews.length > 1 ? 's' : ''} today!
          </Alert>
        )}

        {interviews.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CalendarTodayIcon sx={{ fontSize: 48, color: theme.palette.grey[300], mb: 2 }} />
            <Typography variant='body2' color='text.secondary'>
              No scheduled interviews
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {[...todayInterviews, ...upcomingInterviews].map((interview, index) => (
              <React.Fragment key={interview.id}>
                <ListItem
                  sx={{
                    px: 0,
                    py: 2,
                    borderRadius: 2,
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                  secondaryAction={
                    <IconButton edge='end' size='small'>
                      <MoreVertIcon />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      src={interview.companyLogo}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: theme.palette.primary.main,
                      }}
                    >
                      {interview.company[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant='subtitle2' sx={{ fontWeight: 'bold' }}>
                          {interview.company}
                        </Typography>
                        <Chip
                          size='small'
                          label={interview.status}
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            backgroundColor: getStatusColor(interview.status),
                            color: '#fff',
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                        <Typography variant='body2' color='text.secondary'>
                          {interview.position}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarTodayIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                            <Typography variant='caption' color='text.secondary'>
                              {interview.date} at {interview.time}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              color: theme.palette.primary.main,
                            }}
                          >
                            {getInterviewIcon(interview.type)}
                            <Typography variant='caption' sx={{ textTransform: 'capitalize' }}>
                              {interview.type}
                            </Typography>
                          </Box>
                        </Box>
                      </Stack>
                    }
                  />
                </ListItem>
                {index < todayInterviews.length + upcomingInterviews.length - 1 && (
                  <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}` }} />
                )}
              </React.Fragment>
            ))}
          </List>
        )}

        {interviews.length > upcomingInterviews.length + todayInterviews.length && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant='caption' color='text.secondary'>
              +{interviews.length - upcomingInterviews.length - todayInterviews.length} more interviews
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default InterviewSchedule
