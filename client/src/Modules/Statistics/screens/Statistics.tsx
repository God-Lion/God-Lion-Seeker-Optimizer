// src/Modules/Statistics/screens/Statistics.tsx

import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Paper,
  useTheme,
  alpha,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material'
import Grid from 'src/components/Grid'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend,
  RadialBarChart,
  RadialBar,
} from 'recharts'
import { useStatisticsManagement, TimeRange } from '../hooks/useStatisticsManagement'

/**
 * Statistics Dashboard Component
 * Displays comprehensive analytics and visualizations
 */
const Statistics: React.FC = (): React.ReactElement => {
  const theme = useTheme()
  
  const {
    // State
    timeRange,
    
    // Data
    overview,
    sessionStats,
    jobsByType,
    jobsByExperience,
    jobsByCompany,
    scrapingActivity,
    topSkills,
    jobTrends,
    
    // Loading states
    isLoading,
    isFetching,
    error,
    
    // Actions
    updateTimeRange,
    refreshAll,
    
    // Computed
    hasData,
    timeRangeLabel,
  } = useStatisticsManagement()

  // Color palette for charts
  const COLORS = React.useMemo(
    () => [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
      alpha(theme.palette.primary.main, 0.7),
      alpha(theme.palette.secondary.main, 0.7),
    ],
    [theme.palette]
  )

  if (isLoading && !hasData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 1 }}>
            Statistics & Analytics
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {timeRangeLabel} • Last updated: {overview?.timestamp ? new Date(overview.timestamp).toLocaleString() : 'N/A'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size='small' sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label='Time Range'
              onChange={(e) => updateTimeRange(Number(e.target.value) as TimeRange)}
            >
              <MenuItem value={7}>Last 7 days</MenuItem>
              <MenuItem value={30}>Last 30 days</MenuItem>
              <MenuItem value={90}>Last 90 days</MenuItem>
              <MenuItem value={365}>Last year</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title='Refresh data'>
            <IconButton 
              onClick={refreshAll} 
              disabled={isFetching}
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity='error' sx={{ mb: 3 }} onClose={refreshAll}>
          {error}
        </Alert>
      )}

      {/* Overview Cards */}
      {overview && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={0} 
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WorkIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                  <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
                    Total Jobs
                  </Typography>
                </Box>
                <Typography variant='h3' sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                  {overview.total_jobs.toLocaleString()}
                </Typography>
                <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                  +{overview.recent_jobs_7_days.toLocaleString()} in last 7 days
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{ 
                bgcolor: alpha(theme.palette.secondary.main, 0.05),
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BusinessIcon sx={{ color: theme.palette.secondary.main, mr: 1 }} />
                  <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
                    Total Companies
                  </Typography>
                </Box>
                <Typography variant='h3' sx={{ fontWeight: 'bold', color: theme.palette.secondary.main }}>
                  {overview.total_companies.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{ 
                bgcolor: alpha(theme.palette.success.main, 0.05),
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ScheduleIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
                  <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
                    Scraping Sessions
                  </Typography>
                </Box>
                <Typography variant='h3' sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                  {overview.total_sessions.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{ 
                bgcolor: alpha(theme.palette.info.main, 0.05),
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUpIcon sx={{ color: theme.palette.info.main, mr: 1 }} />
                  <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
                    Analyzed Jobs
                  </Typography>
                </Box>
                <Typography variant='h3' sx={{ fontWeight: 'bold', color: theme.palette.info.main }}>
                  {overview.analyzed_jobs.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts Row 1: Job Type (Bar) and Experience (Radial) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={7}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 3 }}>
              Jobs Distribution by Type
            </Typography>
            <ResponsiveContainer width='100%' height={350}>
              <BarChart data={jobsByType}>
                <CartesianGrid strokeDasharray='3 3' stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis 
                  dataKey='job_type' 
                  angle={-15} 
                  textAnchor='end' 
                  height={100}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                />
                <YAxis tick={{ fill: theme.palette.text.secondary }} />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey='count' fill={theme.palette.primary.main} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 3 }}>
              Experience Level Distribution
            </Typography>
            <ResponsiveContainer width='100%' height={350}>
              <RadialBarChart 
                cx='50%' 
                cy='50%' 
                innerRadius='30%' 
                outerRadius='90%' 
                data={jobsByExperience.map((item, index) => ({
                  name: item.experience_level,
                  value: item.count,
                  fill: COLORS[index % COLORS.length],
                }))}
              >
                <RadialBar dataKey='value' label={{ position: 'insideStart', fill: '#fff' }} />
                <Legend 
                  iconSize={10} 
                  layout='vertical' 
                  verticalAlign='middle' 
                  align='right'
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row 2: Scraping Activity (Area) and Job Trends (Line) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 3 }}>
              Scraping Activity Over Time
            </Typography>
            <ResponsiveContainer width='100%' height={350}>
              <AreaChart data={scrapingActivity}>
                <defs>
                  <linearGradient id='colorScraped' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                    <stop offset='95%' stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray='3 3' stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis 
                  dataKey='date' 
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                />
                <YAxis tick={{ fill: theme.palette.text.secondary }} />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                />
                <Area
                  type='monotone'
                  dataKey='jobs_scraped'
                  stroke={theme.palette.primary.main}
                  fillOpacity={1}
                  fill='url(#colorScraped)'
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 3 }}>
              Job Posting Trends
            </Typography>
            <ResponsiveContainer width='100%' height={350}>
              <LineChart data={jobTrends?.daily_jobs || []}>
                <CartesianGrid strokeDasharray='3 3' stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis 
                  dataKey='date' 
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                />
                <YAxis tick={{ fill: theme.palette.text.secondary }} />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                />
                <Line
                  type='monotone'
                  dataKey='count'
                  stroke={theme.palette.success.main}
                  strokeWidth={3}
                  dot={{ fill: theme.palette.success.main, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Tables Row: Top Companies and Top Skills */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 3 }}>
              Top Companies by Job Postings
            </Typography>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.background.default }}>
                      Rank
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.background.default }}>
                      Company
                    </TableCell>
                    <TableCell align='right' sx={{ fontWeight: 'bold', bgcolor: theme.palette.background.default }}>
                      Job Count
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobsByCompany.map((company, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        },
                      }}
                    >
                      <TableCell>
                        <Chip 
                          label={`#${index + 1}`} 
                          size='small' 
                          sx={{ 
                            bgcolor: index < 3 ? theme.palette.warning.main : theme.palette.grey[300],
                            color: index < 3 ? 'white' : 'inherit',
                            fontWeight: 'bold',
                          }} 
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {company.company}
                      </TableCell>
                      <TableCell align='right'>
                        <Chip 
                          label={company.count.toLocaleString()} 
                          size='small' 
                          color='primary' 
                          variant='outlined'
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 3 }}>
              Top Required Skills
            </Typography>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.background.default }}>
                      Rank
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.background.default }}>
                      Skill
                    </TableCell>
                    <TableCell align='right' sx={{ fontWeight: 'bold', bgcolor: theme.palette.background.default }}>
                      Frequency
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topSkills.map((skill, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                        },
                      }}
                    >
                      <TableCell>
                        <Chip 
                          label={`#${index + 1}`} 
                          size='small' 
                          sx={{ 
                            bgcolor: index < 3 ? theme.palette.success.main : theme.palette.grey[300],
                            color: index < 3 ? 'white' : 'inherit',
                            fontWeight: 'bold',
                          }} 
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {skill.skill}
                      </TableCell>
                      <TableCell align='right'>
                        <Chip 
                          label={skill.count.toLocaleString()} 
                          size='small' 
                          color='secondary' 
                          variant='outlined'
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Session Statistics Cards */}
      {sessionStats && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 2 }}>
              Session Performance Metrics
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant='body2' sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  Total Sessions
                </Typography>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {sessionStats.total_sessions.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Chip label={`✓ ${sessionStats.completed_sessions}`} size='small' color='success' />
                  <Chip label={`✗ ${sessionStats.failed_sessions}`} size='small' color='error' />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant='body2' sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  Success Rate
                </Typography>
                <Typography variant='h4' sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                  {sessionStats.success_rate.toFixed(1)}%
                </Typography>
                <Box sx={{ mt: 2, height: 8, bgcolor: alpha(theme.palette.success.main, 0.2), borderRadius: 1 }}>
                  <Box 
                    sx={{ 
                      width: `${sessionStats.success_rate}%`, 
                      height: '100%', 
                      bgcolor: theme.palette.success.main,
                      borderRadius: 1,
                      transition: 'width 0.3s',
                    }} 
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant='body2' sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  Avg Jobs/Session
                </Typography>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {sessionStats.average_jobs_per_session.toFixed(1)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant='body2' sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  Total Jobs Scraped
                </Typography>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {sessionStats.total_jobs_scraped.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}

export default Statistics
