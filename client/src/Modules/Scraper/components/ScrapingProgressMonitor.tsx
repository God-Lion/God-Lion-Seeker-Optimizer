// src/Modules/Scraper/components/ScrapingProgressMonitor.tsx

import React from 'react'
import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Typography,
  Chip,
  Alert,
  Stack
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { useScrapingProgress } from '../../../shared/hooks/useSSE'

interface ScrapingProgressMonitorProps {
  sessionId: number
  onComplete?: () => void
  onError?: (error: string) => void
}

export const ScrapingProgressMonitor: React.FC<ScrapingProgressMonitorProps> = ({
  sessionId,
  onComplete,
  onError
}) => {
  const {
    progress,
    jobsScraped,
    totalJobs,
    status,
    isComplete,
    isFailed,
    isStopped,
    isConnected,
    error
  } = useScrapingProgress(sessionId)

  // Trigger callbacks
  React.useEffect(() => {
    if (isComplete) {
      onComplete?.()
    }
  }, [isComplete, onComplete])

  React.useEffect(() => {
    if (error) {
      onError?.(error)
    }
  }, [error, onError])

  // Status color mapping
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'failed':
        return 'error'
      case 'stopped':
        return 'warning'
      case 'running':
        return 'info'
      default:
        return 'default'
    }
  }

  // Status icon
  const getStatusIcon = () => {
    if (isComplete) return <CheckCircleIcon color="success" />
    if (isFailed) return <ErrorIcon color="error" />
    if (isStopped) return <StopIcon color="warning" />
    return null
  }

  return (
    <Card sx={{ maxWidth: 600, margin: 'auto', mt: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Scraping Progress
            </Typography>
            <Chip
              label={status.toUpperCase()}
              color={getStatusColor()}
              size="small"
              icon={getStatusIcon()}
            />
          </Box>

          {/* Connection Status */}
          {!isConnected && !isComplete && (
            <Alert severity="warning" icon={<RefreshIcon />}>
              Reconnecting to server...
            </Alert>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {/* Progress Bar */}
          <Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Jobs Scraped: {jobsScraped} / {totalJobs}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {progress.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={getStatusColor()}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Statistics */}
          <Box display="flex" gap={2} flexWrap="wrap">
            <Box flex={1}>
              <Typography variant="caption" color="text.secondary">
                Session ID
              </Typography>
              <Typography variant="body1">
                #{sessionId}
              </Typography>
            </Box>
            <Box flex={1}>
              <Typography variant="caption" color="text.secondary">
                Status
              </Typography>
              <Typography variant="body1">
                {status}
              </Typography>
            </Box>
          </Box>

          {/* Completion Message */}
          {isComplete && (
            <Alert severity="success" icon={<CheckCircleIcon />}>
              Scraping completed successfully! Found {jobsScraped} jobs.
            </Alert>
          )}

          {isFailed && (
            <Alert severity="error">
              Scraping failed. Please try again or check the logs.
            </Alert>
          )}

          {isStopped && (
            <Alert severity="warning">
              Scraping was stopped. {jobsScraped} jobs were scraped.
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
