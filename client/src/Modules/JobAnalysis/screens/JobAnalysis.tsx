// src/Modules/JobAnalysis/screens/JobAnalysis.tsx

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
  LinearProgress,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Pagination,
  Slider,
  FormControlLabel,
  Switch,
  Button,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import PsychologyIcon from '@mui/icons-material/Psychology'
import RefreshIcon from '@mui/icons-material/Refresh'
import DeleteIcon from '@mui/icons-material/Delete'
import FilterListIcon from '@mui/icons-material/FilterList'
import { useJobAnalysisManagement } from '../hooks'

const JobAnalysis: React.FC = (): React.ReactElement => {
  const theme = useTheme()

  // Use the business logic hook
  const {
    // State
    minMatchScore,
    currentPage,
    filterRecommended,

    // Data
    stats,
    recommendedJobs,
    totalJobs,
    totalPages,
    isLoading,
    error,
    matchScoreDistribution,
    averageScores,

    // Actions
    setMinMatchScore,
    toggleRecommendedFilter,
    setPage,
    deleteAnalysis,
    refresh,
    clearFilters,

    // Computed
    hasFilters,
  } = useJobAnalysisManagement(20)

  /**
   * Handle pagination change
   */
  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setPage(page)
  }

  /**
   * Handle deletion with confirmation
   */
  const handleDeleteAnalysis = async (jobId: number) => {
    if (window.confirm('Are you sure you want to delete this analysis?')) {
      const success = await deleteAnalysis(jobId)
      if (!success) {
        alert('Failed to delete analysis. Please try again.')
      }
    }
  }

  /**
   * Get match score color based on value
   */
  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'success'
    if (score >= 60) return 'warning'
    return 'error'
  }

  /**
   * Get match score label
   */
  const getMatchScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match'
    if (score >= 60) return 'Good Match'
    if (score >= 40) return 'Fair Match'
    return 'Poor Match'
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PsychologyIcon sx={{ fontSize: '2.5rem', color: theme.palette.primary.main }} />
          <Box>
            <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
              Job Analysis & Recommendations
            </Typography>
            <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
              AI-powered job matching and analysis
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={refresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {hasFilters && (
            <Button
              variant='outlined'
              size='small'
              onClick={clearFilters}
              startIcon={<FilterListIcon />}
            >
              Clear Filters
            </Button>
          )}
        </Box>
      </Box>

      {/* Error Message */}
      {error && (
        <Alert severity='error' sx={{ mb: 3 }} onClose={refresh}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Analysis Statistics */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant='body2' sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  Total Analyses
                </Typography>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {stats.total_analyses.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant='body2' sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  Recommended Jobs
                </Typography>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {stats.recommended_analyses || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant='body2' sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  Avg Match Score
                </Typography>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {stats.average_match_score || 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant='body2' sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  High Match Jobs
                </Typography>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {stats.high_match_count || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant='body2' sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  Recommendation Rate
                </Typography>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {stats.recommendation_rate || 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 4, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <FilterListIcon sx={{ color: theme.palette.primary.main }} />
          <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
            Filters
          </Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant='body2' sx={{ mb: 1, fontWeight: 'bold' }}>
              Minimum Match Score: {minMatchScore}%
            </Typography>
            <Slider
              value={minMatchScore}
              onChange={(_, value) => setMinMatchScore(value as number)}
              min={0}
              max={100}
              step={5}
              marks={[
                { value: 0, label: '0%' },
                { value: 50, label: '50%' },
                { value: 100, label: '100%' },
              ]}
              valueLabelDisplay="auto"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={filterRecommended}
                  onChange={toggleRecommendedFilter}
                  color="primary"
                />
              }
              label="Show Only Recommended"
            />
          </Grid>
        </Grid>
      </Card>

      {/* Recommended Jobs */}
      {!isLoading && recommendedJobs.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <TrendingUpIcon sx={{ color: theme.palette.success.main }} />
              <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                Recommended Jobs
              </Typography>
              <Chip 
                label={`${totalJobs} matches`} 
                size='small' 
                color='success' 
              />
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Job Title</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Company</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Match Score</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Skills</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Experience</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Education</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recommendedJobs.map((job) => (
                    <TableRow
                      key={job.id}
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {job.title}
                      </TableCell>
                      <TableCell>{job.company_name}</TableCell>
                      <TableCell>{job.location}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant='determinate'
                              value={job.match_score}
                              sx={{ 
                                width: 60, 
                                height: 8, 
                                borderRadius: 4,
                                backgroundColor: theme.palette.grey[300],
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: theme.palette[getMatchScoreColor(job.match_score)].main,
                                },
                              }}
                            />
                            <Typography variant='body2' sx={{ fontWeight: 'bold', minWidth: 35 }}>
                              {job.match_score}%
                            </Typography>
                          </Box>
                          <Typography variant='caption' sx={{ color: theme.palette.text.secondary }}>
                            {getMatchScoreLabel(job.match_score)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${job.analysis.skills_match}%`} 
                          size='small' 
                          color={job.analysis.skills_match >= 70 ? 'success' : job.analysis.skills_match >= 50 ? 'warning' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${job.analysis.experience_match}%`} 
                          size='small' 
                          color={job.analysis.experience_match >= 70 ? 'success' : job.analysis.experience_match >= 50 ? 'warning' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${job.analysis.education_match}%`} 
                          size='small' 
                          color={job.analysis.education_match >= 70 ? 'success' : job.analysis.education_match >= 50 ? 'warning' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Delete Analysis">
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleDeleteAnalysis(job.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color='primary'
            size='large'
          />
        </Box>
      )}

      {/* No Recommendations Message */}
      {!isLoading && recommendedJobs.length === 0 && (
        <Card sx={{ textAlign: 'center', p: 5 }}>
          <PsychologyIcon sx={{ fontSize: '4rem', color: theme.palette.text.secondary, mb: 2 }} />
          <Typography variant='h6' sx={{ color: theme.palette.text.secondary, mb: 1 }}>
            No Job Recommendations Available
          </Typography>
          <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
            {hasFilters 
              ? 'Try adjusting your filters to see more results.' 
              : 'Start scraping jobs and analyzing them to get personalized recommendations.'
            }
          </Typography>
          {hasFilters && (
            <Button
              variant='outlined'
              onClick={clearFilters}
              sx={{ mt: 2 }}
            >
              Clear Filters
            </Button>
          )}
        </Card>
      )}

      {/* Analysis Insights */}
      {!isLoading && recommendedJobs.length > 0 && (
        <Grid container spacing={3} sx={{ mt: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 2 }}>
                  Match Score Distribution
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { label: 'Excellent (80-100%)', count: matchScoreDistribution.excellent, color: 'success' },
                    { label: 'Good (60-79%)', count: matchScoreDistribution.good, color: 'warning' },
                    { label: 'Fair (40-59%)', count: matchScoreDistribution.fair, color: 'error' },
                    { label: 'Poor (0-39%)', count: matchScoreDistribution.poor, color: 'error' },
                  ].map((range) => (
                    <Box key={range.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant='body2'>{range.label}</Typography>
                      <Chip 
                        label={range.count} 
                        size='small' 
                        color={range.color as any}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 2 }}>
                  Analysis Summary
                </Typography>
                <Paper sx={{ p: 2, backgroundColor: theme.palette.background.default }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
                        Average Skills Match
                      </Typography>
                      <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                        {averageScores.skills}%
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
                        Average Experience Match
                      </Typography>
                      <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                        {averageScores.experience}%
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
                        Average Education Match
                      </Typography>
                      <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                        {averageScores.education}%
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}

export default JobAnalysis
