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
  Skeleton,
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
  stats?: ApplicationStats
  loading?: boolean
}

export const ApplicationsOverview: React.FC<ApplicationsOverviewProps> = ({ 
  stats, 
  loading = false,
}) => {
  const theme = useTheme()

  // Default stats if not provided
  const safeStats: ApplicationStats = stats || {
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    interviews: 0,
  }

  const getSuccessRate = () => {
    if (safeStats.total === 0) return 0
    return Math.round((safeStats.accepted / safeStats.total) * 100)
  }

  const statusItems = [
    {
      label: 'Pending',
      count: safeStats.pending,
      color: theme.palette.warning.main,
      icon: <PendingIcon sx={{ fontSize: 20 }} />,
    },
    {
      label: 'Accepted',
      count: safeStats.accepted,
      color: theme.palette.success.main,
      icon: <CheckCircleIcon sx={{ fontSize: 20 }} />,
    },
    {
      label: 'Interviews',
      count: safeStats.interviews,
      color: theme.palette.info.main,
      icon: <ScheduleIcon sx={{ fontSize: 20 }} />,
    },
    {
      label: 'Rejected',
      count: safeStats.rejected,
      color: theme.palette.error.main,
      icon: <CancelIcon sx={{ fontSize: 20 }} />,
    },
  ]

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" height={32} sx={{ mb: 3 }} />
          <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={200} />
        </CardContent>
      </Card>
    )
  }

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
              {safeStats.total}
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
