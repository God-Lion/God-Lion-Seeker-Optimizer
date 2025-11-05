import React from 'react'
import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  Stack,
  Fade
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  CloudUpload as CloudUploadIcon,
  Psychology as PsychologyIcon,
  Analytics as AnalyticsIcon,
  EmojiEvents as EmojiEventsIcon
} from '@mui/icons-material'
import { useAnalysisProgress } from '../../../shared/hooks/useSSE'

interface AnalysisProgressMonitorProps {
  analysisId: number
  onComplete?: (result: any) => void
  onError?: (error: string) => void
}

const stages = [
  { key: 'parsing', label: 'Parsing Resume', icon: <CloudUploadIcon /> },
  { key: 'extracting', label: 'Extracting Data', icon: <PsychologyIcon /> },
  { key: 'matching', label: 'Matching Roles', icon: <AnalyticsIcon /> },
  { key: 'scoring', label: 'Scoring Fits', icon: <EmojiEventsIcon /> }
]

export const AnalysisProgressMonitor: React.FC<AnalysisProgressMonitorProps> = ({
  analysisId,
  onComplete,
  onError
}) => {
  const {
    stage,
    progress,
    step,
    message,
    result,
    isComplete,
    isConnected,
    error
  } = useAnalysisProgress(analysisId)

  // Trigger callbacks
  React.useEffect(() => {
    if (isComplete && result) {
      onComplete?.(result)
    }
  }, [isComplete, result, onComplete])

  React.useEffect(() => {
    if (error) {
      onError?.(error)
    }
  }, [error, onError])

  // Get active step index
  const activeStep = stages.findIndex(s => s.key === stage)

  return (
    <Card sx={{ maxWidth: 700, margin: 'auto', mt: 3 }}>
      <CardContent>
        <Stack spacing={3}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Resume Analysis
            </Typography>
            {isComplete && (
              <Chip
                label="COMPLETE"
                color="success"
                icon={<CheckCircleIcon />}
                size="small"
              />
            )}
          </Box>

          {/* Connection Status */}
          {!isConnected && !isComplete && (
            <Alert severity="warning">
              Reconnecting to server...
            </Alert>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error" icon={<ErrorIcon />}>
              {error}
            </Alert>
          )}

          {/* Stepper */}
          <Stepper activeStep={activeStep} alternativeLabel>
            {stages.map((stageInfo, index) => (
              <Step key={stageInfo.key} completed={index < activeStep || isComplete}>
                <StepLabel
                  icon={stageInfo.icon}
                  error={!!(error && index === activeStep)}
                >
                  {stageInfo.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Progress Bar */}
          {!isComplete && (
            <Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  {step || stages[activeStep]?.label || 'Processing...'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {progress.toFixed(0)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                color="primary"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          {/* Current Message */}
          {message && !isComplete && (
            <Fade in>
              <Alert severity="info" variant="outlined">
                {message}
              </Alert>
            </Fade>
          )}

          {/* Result Preview */}
          {isComplete && result && (
            <Fade in>
              <Alert severity="success" icon={<CheckCircleIcon />}>
                <Typography variant="body2" gutterBottom>
                  <strong>Analysis Complete!</strong>
                </Typography>
                <Typography variant="caption" display="block">
                  Found {result.top_roles?.length || 0} matching roles
                </Typography>
                <Typography variant="caption" display="block">
                  Skills identified: {result.resume_summary?.total_skills || 0}
                </Typography>
              </Alert>
            </Fade>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
