import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import PersonIcon from '@mui/icons-material/Person'
import WorkIcon from '@mui/icons-material/Work'
import SchoolIcon from '@mui/icons-material/School'
import DescriptionIcon from '@mui/icons-material/Description'
import LinkIcon from '@mui/icons-material/Link'

export interface ProfileSection {
  id: string
  label: string
  completed: boolean
  icon: React.ReactNode
}

interface ProfileCompletionWidgetProps {
  sections: ProfileSection[]
  onCompleteSection?: (sectionId: string) => void
}

export const ProfileCompletionWidget: React.FC<ProfileCompletionWidgetProps> = ({
  sections,
  onCompleteSection,
}) => {
  const theme = useTheme()

  const defaultSections: ProfileSection[] = sections.length > 0 ? sections : [
    {
      id: 'basic-info',
      label: 'Basic Information',
      completed: true,
      icon: <PersonIcon />,
    },
    {
      id: 'work-experience',
      label: 'Work Experience',
      completed: true,
      icon: <WorkIcon />,
    },
    {
      id: 'education',
      label: 'Education',
      completed: false,
      icon: <SchoolIcon />,
    },
    {
      id: 'resume',
      label: 'Upload Resume',
      completed: true,
      icon: <DescriptionIcon />,
    },
    {
      id: 'social-links',
      label: 'Social Links',
      completed: false,
      icon: <LinkIcon />,
    },
  ]

  const completedCount = defaultSections.filter((s) => s.completed).length
  const totalCount = defaultSections.length
  const completionPercentage = Math.round((completedCount / totalCount) * 100)

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 2 }}>
          Profile Completion
        </Typography>

        {/* Progress Overview */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              {completedCount} of {totalCount} completed
            </Typography>
            <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
              {completionPercentage}%
            </Typography>
          </Box>
          <LinearProgress
            variant='determinate'
            value={completionPercentage}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                backgroundColor:
                  completionPercentage === 100
                    ? theme.palette.success.main
                    : theme.palette.primary.main,
                borderRadius: 4,
              },
            }}
          />
        </Box>

        {/* Completion Message */}
        {completionPercentage === 100 ? (
          <Box
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              backgroundColor: `${theme.palette.success.main}10`,
              border: `1px solid ${theme.palette.success.main}40`,
            }}
          >
            <Typography variant='body2' color='success.main' sx={{ fontWeight: 600 }}>
              🎉 Your profile is complete!
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              You're all set to get the best job recommendations
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              backgroundColor: `${theme.palette.warning.main}10`,
              border: `1px solid ${theme.palette.warning.main}40`,
            }}
          >
            <Typography variant='body2' color='warning.main' sx={{ fontWeight: 600 }}>
              Complete your profile
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              A complete profile helps you get better job matches
            </Typography>
          </Box>
        )}

        {/* Section List */}
        <List sx={{ p: 0 }}>
          {defaultSections.map((section, index) => (
            <ListItem
              key={section.id}
              sx={{
                px: 0,
                py: 1,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {section.completed ? (
                  <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
                ) : (
                  <RadioButtonUncheckedIcon sx={{ color: theme.palette.grey[400] }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant='body2'
                      sx={{
                        textDecoration: section.completed ? 'line-through' : 'none',
                        color: section.completed
                          ? theme.palette.text.secondary
                          : theme.palette.text.primary,
                      }}
                    >
                      {section.label}
                    </Typography>
                    {section.completed && (
                      <Chip
                        label='Done'
                        size='small'
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          backgroundColor: theme.palette.success.main,
                          color: '#fff',
                        }}
                      />
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        {/* Action Button */}
        {completionPercentage < 100 && (
          <Button
            fullWidth
            variant='contained'
            sx={{ mt: 2 }}
            onClick={() => {
              const nextIncomplete = defaultSections.find((s) => !s.completed)
              if (nextIncomplete && onCompleteSection) {
                onCompleteSection(nextIncomplete.id)
              }
            }}
          >
            Complete Profile
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default ProfileCompletionWidget
