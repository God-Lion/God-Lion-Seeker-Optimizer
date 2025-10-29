import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  Divider,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import WorkIcon from '@mui/icons-material/Work'
import SearchIcon from '@mui/icons-material/Search'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import BarChartIcon from '@mui/icons-material/BarChart'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import SettingsIcon from '@mui/icons-material/Settings'

export interface QuickAction {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  path: string
  color: string
  disabled?: boolean
}

interface QuickActionsProps {
  onActionClick?: (actionId: string) => void
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick }) => {
  const theme = useTheme()
  const navigate = useNavigate()

  const actions: QuickAction[] = [
    {
      id: 'scrape-jobs',
      label: 'Scrape Jobs',
      description: 'Start a new job scraping session',
      icon: <SearchIcon />,
      path: '/scraper',
      color: theme.palette.primary.main,
    },
    {
      id: 'search-jobs',
      label: 'Search Jobs',
      description: 'Browse scraped job listings',
      icon: <WorkIcon />,
      path: '/jobs',
      color: theme.palette.info.main,
    },
    {
      id: 'analyze-profile',
      label: 'Analyze Profile',
      description: 'Upload and analyze your resume',
      icon: <CloudUploadIcon />,
      path: '/profile-analyzer',
      color: theme.palette.success.main,
    },
    {
      id: 'view-statistics',
      label: 'View Statistics',
      description: 'Check your application stats',
      icon: <BarChartIcon />,
      path: '/statistics',
      color: theme.palette.warning.main,
    },
    {
      id: 'automation',
      label: 'Automation',
      description: 'Configure job application automation',
      icon: <AutoAwesomeIcon />,
      path: '/automation',
      color: theme.palette.secondary.main,
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Manage your preferences',
      icon: <SettingsIcon />,
      path: '/profile/settings',
      color: theme.palette.grey[700],
    },
  ]

  const handleActionClick = (action: QuickAction) => {
    if (onActionClick) {
      onActionClick(action.id)
    }
    navigate(action.path)
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 2 }}>
          Quick Actions
        </Typography>

        <Stack spacing={2}>
          {actions.map((action, index) => (
            <Box key={action.id}>
              <Button
                fullWidth
                variant='outlined'
                disabled={action.disabled}
                onClick={() => handleActionClick(action)}
                sx={{
                  justifyContent: 'flex-start',
                  py: 2,
                  px: 2,
                  borderRadius: 2,
                  textAlign: 'left',
                  borderColor: theme.palette.divider,
                  '&:hover': {
                    borderColor: action.color,
                    backgroundColor: `${action.color}10`,
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      backgroundColor: `${action.color}20`,
                      color: action.color,
                      flexShrink: 0,
                    }}
                  >
                    {action.icon}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant='body2'
                      sx={{ fontWeight: 600, color: theme.palette.text.primary }}
                    >
                      {action.label}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {action.description}
                    </Typography>
                  </Box>
                </Box>
              </Button>
              {index < actions.length - 1 && <Divider sx={{ my: 1 }} />}
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

export default QuickActions
