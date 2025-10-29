import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Switch,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Divider,
  LinearProgress,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import ScheduleIcon from '@mui/icons-material/Schedule'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { AutomationConfig, AutomationStats } from '../types'

interface AutomationConfigCardProps {
  config: AutomationConfig
  stats?: AutomationStats
  onEdit?: (configId: string) => void
  onDelete?: (configId: string) => void
  onToggle?: (configId: string, enabled: boolean) => void
  onRunNow?: (configId: string) => void
}

export const AutomationConfigCard: React.FC<AutomationConfigCardProps> = ({
  config,
  stats,
  onEdit,
  onDelete,
  onToggle,
  onRunNow,
}) => {
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleEdit = () => {
    onEdit?.(config.id)
    handleMenuClose()
  }

  const handleDelete = () => {
    onDelete?.(config.id)
    handleMenuClose()
  }

  const getStatusColor = () => {
    if (!config.enabled) return theme.palette.grey[400]
    if (stats?.lastRunStatus === 'success') return theme.palette.success.main
    if (stats?.lastRunStatus === 'failed') return theme.palette.error.main
    return theme.palette.warning.main
  }

  const getStatusText = () => {
    if (!config.enabled) return 'Disabled'
    if (!stats) return 'Not Run Yet'
    return stats.lastRunStatus === 'success' ? 'Running Well' : 'Needs Attention'
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const successRate = stats ? Math.round((stats.successfulApplications / Math.max(stats.totalRuns, 1)) * 100) : 0

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: config.enabled ? `2px solid ${theme.palette.primary.main}` : undefined,
        opacity: config.enabled ? 1 : 0.7,
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                {config.name}
              </Typography>
              <Chip
                label={getStatusText()}
                size='small'
                sx={{
                  backgroundColor: getStatusColor(),
                  color: '#fff',
                  height: 20,
                  fontSize: '0.7rem',
                }}
              />
            </Box>
            <Typography variant='caption' color='text.secondary'>
              Profile: {config.profileId}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Switch
              checked={config.enabled}
              onChange={(e) => onToggle?.(config.id, e.target.checked)}
              size='small'
            />
            <IconButton size='small' onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Criteria Summary */}
        <Box sx={{ mb: 2 }}>
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
            Job Criteria
          </Typography>
          <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap>
            {config.criteria.jobTitles.slice(0, 3).map((title, index) => (
              <Chip key={index} label={title} size='small' sx={{ mb: 0.5 }} />
            ))}
            {config.criteria.jobTitles.length > 3 && (
              <Chip label={`+${config.criteria.jobTitles.length - 3}`} size='small' sx={{ mb: 0.5 }} />
            )}
          </Stack>
        </Box>

        {/* Schedule */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <ScheduleIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
            <Typography variant='caption' color='text.secondary'>
              Schedule: {config.schedule.frequency}
            </Typography>
          </Box>
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
            Max {config.limits.maxPerDay} applications/day
          </Typography>
        </Box>

        {/* Stats */}
        {stats && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant='caption' color='text.secondary'>
                  Success Rate
                </Typography>
                <Typography variant='caption' sx={{ fontWeight: 'bold' }}>
                  {successRate}%
                </Typography>
              </Box>
              <LinearProgress
                variant='determinate'
                value={successRate}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: successRate > 70 ? theme.palette.success.main : theme.palette.warning.main,
                  },
                }}
              />
              <Stack direction='row' spacing={2} sx={{ mt: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CheckCircleIcon sx={{ fontSize: 14, color: theme.palette.success.main }} />
                  <Typography variant='caption'>
                    {stats.successfulApplications} success
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ErrorIcon sx={{ fontSize: 14, color: theme.palette.error.main }} />
                  <Typography variant='caption'>
                    {stats.failedApplications} failed
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUpIcon sx={{ fontSize: 14, color: theme.palette.info.main }} />
                  <Typography variant='caption'>
                    {stats.totalRuns} runs
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </>
        )}

        {/* Last Run */}
        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>
            Last Run: {formatDateTime(config.lastRunAt)}
          </Typography>
          {config.nextRunAt && (
            <Typography variant='caption' color='text.secondary'>
              Next Run: {formatDateTime(config.nextRunAt)}
            </Typography>
          )}
        </Box>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ px: 2, py: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button
          size='small'
          variant='outlined'
          startIcon={<PlayArrowIcon />}
          onClick={() => onRunNow?.(config.id)}
          disabled={!config.enabled}
          sx={{ flexGrow: 1 }}
        >
          Run Now
        </Button>
        <Button
          size='small'
          variant='text'
          onClick={handleEdit}
        >
          Configure
        </Button>
      </CardActions>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit Configuration
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: theme.palette.error.main }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Delete
        </MenuItem>
      </Menu>
    </Card>
  )
}

export default AutomationConfigCard
