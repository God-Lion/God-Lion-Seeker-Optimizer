/**
 * Request Deduplication Examples
 * 
 * Demonstrates various use cases for request deduplication
 */

import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material'
import { useDeduplicatedRequest, useDeduplicatedMutation } from 'src/lib/hooks'
import { getDeduplicationStats, cancelAllRequests, clearDeduplicationCache } from 'src/lib/api'

/**
 * Example 1: Basic Usage
 * Multiple components fetching the same data
 */
function BasicExample() {
  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Example 1: Basic Deduplication
        </Typography>
        <Typography variant='body2' color='text.secondary' gutterBottom>
          Three components fetching the same endpoint - only ONE request is made!
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 2 }}>
          <UserWidget />
          <UserWidget />
          <UserWidget />
        </Box>
      </CardContent>
    </Card>
  )
}

function UserWidget() {
  const { data, loading, error } = useDeduplicatedRequest('/api/user')

  if (loading) return <CircularProgress size={20} />
  if (error) return <Alert severity='error'>Error loading user</Alert>

  return (
    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
      <Typography variant='subtitle2'>User Widget</Typography>
      <Typography variant='body2'>{data?.name || 'No data'}</Typography>
    </Box>
  )
}

/**
 * Example 2: With Refetch
 */
function RefetchExample() {
  const { data, loading, refetch } = useDeduplicatedRequest('/api/stats')

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Example 2: Manual Refetch
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
          <Button variant='contained' onClick={refetch} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          {data && (
            <Typography variant='body2'>
              Active Users: {data.activeUsers || 0}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

/**
 * Example 3: Auto-Polling
 */
function PollingExample() {
  const { data, loading } = useDeduplicatedRequest('/api/live-stats', {
    refetchInterval: 5000, // Poll every 5 seconds
  })

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Example 3: Auto-Polling (Every 5s)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
          {loading && <CircularProgress size={16} />}
          <Typography variant='body2'>
            Requests: {data?.totalRequests || 0}
          </Typography>
          <Typography variant='body2'>
            Errors: {data?.totalErrors || 0}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

/**
 * Example 4: Conditional Fetching
 */
function ConditionalExample() {
  const [enabled, setEnabled] = useState(false)
  const { data, loading } = useDeduplicatedRequest('/api/premium-data', {
    enabled, // Only fetch when enabled
  })

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Example 4: Conditional Fetching
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
          <Button
            variant={enabled ? 'outlined' : 'contained'}
            onClick={() => setEnabled(!enabled)}
          >
            {enabled ? 'Disable' : 'Enable'} Fetching
          </Button>
          {loading && <CircularProgress size={16} />}
          {data && <Chip label='Data Loaded' color='success' />}
        </Box>
      </CardContent>
    </Card>
  )
}

/**
 * Example 5: Mutation Hook
 */
function MutationExample() {
  const [name, setName] = useState('')
  const { mutate, loading, error, data } = useDeduplicatedMutation({
    onSuccess: () => {
      setName('')
      alert('User created successfully!')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate('/api/users', { name })
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Example 5: Mutation (POST Request)
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              size='small'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Enter name'
              disabled={loading}
            />
            <Button type='submit' variant='contained' disabled={loading || !name}>
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </Box>
          {error && <Alert severity='error' sx={{ mt: 2 }}>Error: {error.message}</Alert>}
          {data && <Alert severity='success' sx={{ mt: 2 }}>Created: {data.name}</Alert>}
        </form>
      </CardContent>
    </Card>
  )
}

/**
 * Example 6: Statistics Monitor
 */
function StatisticsExample() {
  const [stats, setStats] = useState(getDeduplicationStats())

  const updateStats = () => {
    setStats(getDeduplicationStats())
  }

  React.useEffect(() => {
    const interval = setInterval(updateStats, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Example 6: Deduplication Statistics
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
          <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
            <Typography variant='body2' color='white'>
              Pending Requests
            </Typography>
            <Typography variant='h4' color='white'>
              {stats.pendingRequests}
            </Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
            <Typography variant='body2' color='white'>
              Cached Responses
            </Typography>
            <Typography variant='h4' color='white'>
              {stats.cachedResponses}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button variant='outlined' size='small' onClick={updateStats}>
            Refresh Stats
          </Button>
          <Button variant='outlined' size='small' onClick={cancelAllRequests}>
            Cancel All
          </Button>
          <Button variant='outlined' size='small' onClick={clearDeduplicationCache}>
            Clear Cache
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}

/**
 * Main Examples Component
 */
export default function RequestDeduplicationExamples() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' gutterBottom>
        Request Deduplication Examples
      </Typography>
      <Typography variant='body1' color='text.secondary' paragraph>
        These examples demonstrate various use cases for request deduplication.
        Open the browser console to see deduplication logs.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <BasicExample />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
          <RefetchExample />
          <PollingExample />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
          <ConditionalExample />
          <MutationExample />
        </Box>
        <StatisticsExample />
      </Box>
    </Box>
  )
}
