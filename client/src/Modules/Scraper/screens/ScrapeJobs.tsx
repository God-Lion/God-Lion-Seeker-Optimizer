// src/Modules/Scraper/screens/ScrapeJobs.tsx

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  Stack,
  FormControlLabel,
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { useTheme } from '@mui/material/styles'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RefreshIcon from '@mui/icons-material/Refresh'
import HistoryIcon from '@mui/icons-material/History'
import VisibilityIcon from '@mui/icons-material/Visibility'
import StopIcon from '@mui/icons-material/Stop'
import { 
  useStartScraping, 
  useStopSession, 
  useScrapingSessions,
  useScrapingSession,
} from '../hooks'
import { ScrapeRequest, ScrapingSession } from '../types'

interface ScrapeConfig {
  keywords: string
  locations: string
  jobTypes: string[]
  experienceLevels: string[]
  companies: string
  daysPosted: number
}

const ScrapeJobs: React.FC = (): React.ReactElement => {
  const theme = useTheme()
  
  // Local state
  const [config, setConfig] = useState<ScrapeConfig>({
    keywords: '',
    locations: '',
    jobTypes: ['fulltime'],
    experienceLevels: [],
    companies: '',
    daysPosted: 7,
  })
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  // Hooks
  const { 
    data: sessionsData, 
    isLoading: sessionsLoading,
    refetch: refetchSessions 
  } = useScrapingSessions({ skip: 0, limit: 50 })
  
  const {
    data: currentSessionData,
    // isLoading: sessionLoading,
  } = useScrapingSession(currentSessionId, {
    enabled: !!currentSessionId,
  })

  const startScrapingMutation = useStartScraping({
    onSuccess: (response) => {
      setCurrentSessionId(response.data.session_id)
    },
    onError: (error: any) => {
      console.error('Failed to start scraping:', error)
    },
  })

  const stopSessionMutation = useStopSession({
    onSuccess: () => {
      // Session stopped successfully
    },
    onError: (error: any) => {
      console.error('Failed to stop session:', error)
    },
  })

  // Derived state
  const sessions = sessionsData?.data?.sessions || []
  const currentSession = currentSessionData?.data || null
  const loading = startScrapingMutation.isPending || stopSessionMutation.isPending
  const error = startScrapingMutation.error || stopSessionMutation.error

  // Set initial current session to the most recent one
  useEffect(() => {
    if (sessions.length > 0 && !currentSessionId) {
      const mostRecent = sessions[0]
      if (mostRecent.status === 'running' || mostRecent.status === 'pending') {
        setCurrentSessionId(mostRecent.session_id)
      }
    }
  }, [sessions, currentSessionId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setConfig((prev) => ({
      ...prev,
      [name]: name === 'daysPosted' ? parseInt(value) : value,
    }))
  }

  const handleJobTypeChange = (type: string) => {
    setConfig((prev) => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(type)
        ? prev.jobTypes.filter((t) => t !== type)
        : [...prev.jobTypes, type],
    }))
  }

  const handleStartScraping = async () => {
    if (!config.keywords.trim()) {
      return
    }

    const request: ScrapeRequest = {
      query: config.keywords,
      location: config.locations || undefined,
      max_jobs: 25,
      experience_level: config.experienceLevels.length > 0 ? config.experienceLevels[0] : undefined,
    }

    startScrapingMutation.mutate({ data: request })
  }

  const handleRefreshStatus = () => {
    refetchSessions()
  }

  const handleStopSession = () => {
    if (!currentSessionId) return
    stopSessionMutation.mutate({ session_id: currentSessionId })
  }

  const handleViewSessionDetails = (session: ScrapingSession) => {
    setCurrentSessionId(session.session_id)
    setShowHistory(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'failed': return 'error'
      case 'stopped': return 'warning'
      case 'running': return 'primary'
      case 'pending': return 'warning'
      default: return 'default'
    }
  }

  const getProgressValue = (session: ScrapingSession) => {
    if (session.status === 'completed') return 100
    if (session.status === 'failed' || session.status === 'stopped') return 0
    if (session.jobs_found === 0) return 0
    return (session.jobs_scraped / session.jobs_found) * 100
  }

  const jobTypeOptions = [
    { id: 'fulltime', label: 'Full Time' },
    { id: 'parttime', label: 'Part Time' },
    { id: 'contract', label: 'Contract' },
    { id: 'temporary', label: 'Temporary' },
    { id: 'internship', label: 'Internship' },
  ]

  const experienceLevelOptions = [
    { id: 'entry', label: 'Entry Level' },
    { id: 'mid', label: 'Mid Level' },
    { id: 'senior', label: 'Senior' },
    { id: 'executive', label: 'Executive' },
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
          Job Scraper
        </Typography>
        <Button
          variant='outlined'
          startIcon={<HistoryIcon />}
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? 'Hide History' : 'Show History'}
        </Button>
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error.message || 'An error occurred'}
        </Alert>
      )}

      {!config.keywords.trim() && startScrapingMutation.isError && (
        <Alert severity='error' sx={{ mb: 3 }}>
          Please enter keywords to search for
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Configuration Panel */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 3 }}>
                Scraping Configuration
              </Typography>

              <Stack spacing={3}>
                {/* Keywords */}
                <TextField
                  fullWidth
                  label='Keywords'
                  placeholder='e.g., Python, Data Science, Machine Learning (comma separated)'
                  name='keywords'
                  value={config.keywords}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                  variant='outlined'
                />

                {/* Locations */}
                <TextField
                  fullWidth
                  label='Locations'
                  placeholder='e.g., New York, San Francisco, Remote (comma separated)'
                  name='locations'
                  value={config.locations}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                  variant='outlined'
                />

                {/* Companies */}
                <TextField
                  fullWidth
                  label='Companies (Optional)'
                  placeholder='e.g., Google, Apple, Microsoft (comma separated)'
                  name='companies'
                  value={config.companies}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                  variant='outlined'
                />

                {/* Job Types */}
                <Box>
                  <Typography variant='body2' sx={{ mb: 1, fontWeight: 'bold' }}>
                    Job Types
                  </Typography>
                  <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {jobTypeOptions.map((option) => (
                      <FormControlLabel
                        key={option.id}
                        control={
                          <Checkbox
                            checked={config.jobTypes.includes(option.id)}
                            onChange={() => handleJobTypeChange(option.id)}
                          />
                        }
                        label={option.label}
                      />
                    ))}
                  </Stack>
                </Box>

                {/* Experience Levels */}
                <Box>
                  <Typography variant='body2' sx={{ mb: 1, fontWeight: 'bold' }}>
                    Experience Levels
                  </Typography>
                  <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {experienceLevelOptions.map((option) => (
                      <FormControlLabel
                        key={option.id}
                        control={
                          <Checkbox
                            checked={config.experienceLevels.includes(option.id)}
                            onChange={() => {
                              setConfig((prev) => ({
                                ...prev,
                                experienceLevels: prev.experienceLevels.includes(option.id)
                                  ? prev.experienceLevels.filter((e) => e !== option.id)
                                  : [...prev.experienceLevels, option.id],
                              }))
                            }}
                          />
                        }
                        label={option.label}
                      />
                    ))}
                  </Stack>
                </Box>

                {/* Days Posted */}
                <TextField
                  label='Posted Within (days)'
                  type='number'
                  name='daysPosted'
                  value={config.daysPosted}
                  onChange={handleInputChange}
                  inputProps={{ min: 1, max: 365 }}
                  variant='outlined'
                />

                {/* Action Buttons */}
                <Stack direction='row' spacing={2}>
                  <Button
                    variant='contained'
                    color='success'
                    startIcon={<PlayArrowIcon />}
                    onClick={handleStartScraping}
                    disabled={loading || (currentSession?.status === 'running')}
                  >
                    {loading ? 'Starting...' : 'Start Scraping'}
                  </Button>

                  <Button
                    variant='outlined'
                    startIcon={<RefreshIcon />}
                    onClick={handleRefreshStatus}
                    disabled={sessionsLoading}
                  >
                    Refresh Status
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Panel */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 3 }}>
                Current Session
              </Typography>

              {currentSession ? (
                <Box>
                  {/* Status Indicator */}
                  <Box sx={{ mb: 3 }}>
                    <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: currentSession.status === 'running' ? '#4caf50' : 
                                         currentSession.status === 'completed' ? '#2196f3' :
                                         currentSession.status === 'failed' ? '#f44336' : '#ff9800',
                          animation: currentSession.status === 'running' ? 'pulse 2s infinite' : 'none',
                          '@keyframes pulse': {
                            '0%': { opacity: 1 },
                            '50%': { opacity: 0.5 },
                            '100%': { opacity: 1 },
                          },
                        }}
                      />
                      <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                        {currentSession.status.charAt(0).toUpperCase() + currentSession.status.slice(1)}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Session Info */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant='body2' sx={{ mb: 1, color: theme.palette.text.secondary }}>
                      Query: {currentSession.query}
                    </Typography>
                    {currentSession.location && (
                      <Typography variant='body2' sx={{ mb: 1, color: theme.palette.text.secondary }}>
                        Location: {currentSession.location}
                      </Typography>
                    )}
                  </Box>

                  {/* Progress */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant='body2' sx={{ mb: 1, color: theme.palette.text.secondary }}>
                      Progress
                    </Typography>
                    <LinearProgress
                      variant='determinate'
                      value={getProgressValue(currentSession)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant='caption' sx={{ mt: 1, display: 'block', textAlign: 'right' }}>
                      {currentSession.jobs_scraped} / {currentSession.jobs_found} jobs
                    </Typography>
                  </Box>

                  {/* Stats */}
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: theme.palette.background.default,
                      mb: 2,
                    }}
                  >
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant='body2'>Jobs Found:</Typography>
                        <Chip
                          label={currentSession.jobs_found}
                          size='small'
                          color='primary'
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant='body2'>Jobs Scraped:</Typography>
                        <Chip
                          label={currentSession.jobs_scraped}
                          size='small'
                          color='success'
                        />
                      </Box>
                      {currentSession.started_at && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant='body2'>Started:</Typography>
                          <Typography variant='caption'>
                            {new Date(currentSession.started_at).toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Paper>

                  {currentSession.error_message && (
                    <Alert severity='error' sx={{ mb: 2 }}>
                      {currentSession.error_message}
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  {(currentSession.status === 'running' || currentSession.status === 'pending') && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant='outlined'
                        color='error'
                        startIcon={<StopIcon />}
                        onClick={handleStopSession}
                        disabled={loading}
                        fullWidth
                        size='small'
                      >
                        Stop Session
                      </Button>
                    </Box>
                  )}

                  {currentSession.status === 'stopped' && (
                    <Box sx={{ mt: 2 }}>
                      <Alert severity='warning' sx={{ mb: 1 }}>
                        Session was stopped by user
                      </Alert>
                    </Box>
                  )}
                </Box>
              ) : (
                <Alert severity='info' icon={false}>
                  <Typography variant='body2'>
                    No active scraping session. Start a new scraping job to begin.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sessions History */}
      {showHistory && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 3 }}>
              Scraping History
            </Typography>
            
            {sessions.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Session ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Query</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell align='right' sx={{ fontWeight: 'bold' }}>Jobs Found</TableCell>
                      <TableCell align='right' sx={{ fontWeight: 'bold' }}>Jobs Scraped</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Started</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Completed</TableCell>
                      <TableCell align='center' sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow
                        key={session.session_id}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          #{session.session_id}
                        </TableCell>
                        <TableCell>{session.query}</TableCell>
                        <TableCell>{session.location || 'Any'}</TableCell>
                        <TableCell>
                          <Chip
                            label={session.status}
                            size='small'
                            color={getStatusColor(session.status) as any}
                          />
                        </TableCell>
                        <TableCell align='right'>{session.jobs_found}</TableCell>
                        <TableCell align='right'>{session.jobs_scraped}</TableCell>
                        <TableCell>
                          {session.started_at ? new Date(session.started_at).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          {session.completed_at ? new Date(session.completed_at).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell align='center'>
                          <Tooltip title="View Details">
                            <IconButton
                              size='small'
                              onClick={() => handleViewSessionDetails(session)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant='body2' sx={{ color: theme.palette.text.secondary, textAlign: 'center', py: 3 }}>
                No scraping sessions found. Start your first scraping job to see history here.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default ScrapeJobs
