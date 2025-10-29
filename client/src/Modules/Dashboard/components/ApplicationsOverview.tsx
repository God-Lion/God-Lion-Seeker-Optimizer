import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Stack,
  Divider,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'
import CancelIcon from '@mui/icons-material/Cancel'
import ScheduleIcon from '@mui/icons-material/Schedule'

export interface ApplicationStats {
  total: number
  pending: number
  accepted: number
  rejected: number
  interviews: number
}

interface ApplicationsOverviewProps {
  stats: ApplicationStats
  loading?: boolean
}

export const ApplicationsOverview: React.FC<ApplicationsOverviewProps> = ({ 
  stats, 
  loading = false 
}) => {
  const theme = useTheme()

  const getSuccessRate = () => {
    if (stats.total === 0) return 0
    return Math.round((stats.accepted / stats.total) * 100)
  }

  const statusItems = [
    {
      label: 'Pending',
      count: stats.pending,
      color: theme.palette.warning.main,
      icon: <PendingIcon sx={{ fontSize: 20 }} />,
    },
    {
      label: 'Accepted',
      count: stats.accepted,
      color: theme.palette.success.main,
      icon: <CheckCircleIcon sx={{ fontSize: 20 }} />,
    },
    {
      label: 'Interviews',
      count: stats.interviews,
      color: theme.palette.info.main,
      icon: <ScheduleIcon sx={{ fontSize: 20 }} />,
    },
    {
      label: 'Rejected',
      count: stats.rejected,
      color: theme.palette.error.main,
      icon: <CancelIcon sx={{ fontSize: 20 }} />,
    },
  ]

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 3 }}>
          Applications Overview
        </Typography>

        {/* Total Applications */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              Total Applications
            </Typography>
            <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
              {stats.total}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Success Rate */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              Success Rate
            </Typography>
            <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
              {getSuccessRate()}%
            </Typography>
          </Box>
          <LinearProgress
            variant='determinate'
            value={getSuccessRate()}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                backgroundColor: theme.palette.success.main,
              },
            }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Status Breakdown */}
        <Stack spacing={2}>
          {statusItems.map((item) => (
            <Box
              key={item.label}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                borderRadius: 2,
                backgroundColor: `${item.color}10`,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateX(4px)',
                  backgroundColor: `${item.color}20`,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ color: item.color }}>{item.icon}</Box>
                <Typography variant='body2'>{item.label}</Typography>
              </Box>
              <Chip
                label={item.count}
                size='small'
                sx={{
                  backgroundColor: item.color,
                  color: '#fff',
                  fontWeight: 'bold',
                  minWidth: 40,
                }}
              />
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

export default ApplicationsOverview
