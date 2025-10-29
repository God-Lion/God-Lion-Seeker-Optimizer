// src/Modules/JobsManagement/screens/JobsSearch.tsx

import React from 'react'
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  IconButton,
  Tooltip,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import SearchIcon from '@mui/icons-material/Search'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useJobsManagement } from '../hooks'
import JobDetails from './JobDetails'

const JobsSearch: React.FC = (): React.ReactElement => {
  const theme = useTheme()
  const navigate = useNavigate()

  // Use the business logic hook
  const {
    // State
    searchQuery,
    location,
    company,
    currentPage,
    viewMode,

    // Data
    jobs,
    totalJobs,
    totalPages,
    isLoading,
    error,

    // Actions
    setSearchQuery,
    setLocation,
    setCompany,
    executeSearch,
    resetToList,
    setPage,
    deleteJob,
    refresh,

    // Computed
    isSearchMode,
  } = useJobsManagement(20)

  // Local state for selected job dialog
  const [selectedJobId, setSelectedJobId] = React.useState<number | null>(null)

  /**
   * Handle search form submission
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    executeSearch()
  }

  /**
   * Handle pagination change
   */
  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setPage(page)
  }

  /**
   * Handle job deletion with confirmation
   */
  const handleDeleteJob = async (jobId: number) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      const success = await deleteJob(jobId)
      if (!success) {
        // Error is already handled in the hook
        alert('Failed to delete job. Please try again.')
      }
    }
  }

  /**
   * Navigate to job details page
   */
  const handleViewJobDetails = (jobId: number) => {
    navigate(`/jobs/${jobId}`)
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
          Jobs Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={refresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant={viewMode === 'list' ? 'contained' : 'outlined'}
            onClick={resetToList}
            size='small'
          >
            All Jobs
          </Button>
          <Button
            variant={viewMode === 'search' ? 'contained' : 'outlined'}
            disabled={!searchQuery.trim()}
            size='small'
          >
            Search Results
          </Button>
        </Box>
      </Box>

      {/* Search Form */}
      <Card
        sx={{
          mb: 4,
          p: 3,
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.shadows[2],
        }}
      >
        <form onSubmit={handleSearch}>
          <Grid container spacing={2}>
            {/* Job Title/Keyword Input */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Job Title or Keyword'
                placeholder='e.g., Software Engineer, Data Scientist'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant='outlined'
                size='small'
              />
            </Grid>

            {/* Location Input */}
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label='Location'
                placeholder='e.g., New York, Remote'
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                variant='outlined'
                size='small'
              />
            </Grid>

            {/* Company Input */}
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label='Company'
                placeholder='e.g., Google, Microsoft'
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                variant='outlined'
                size='small'
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12} sm={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant='contained'
                  color='primary'
                  type='submit'
                  startIcon={<SearchIcon />}
                  sx={{ height: '40px', flex: 1 }}
                  disabled={!searchQuery.trim()}
                >
                  Search
                </Button>
                {isSearchMode && (
                  <Button
                    variant='outlined'
                    onClick={resetToList}
                    sx={{ height: '40px' }}
                  >
                    Reset
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </form>
      </Card>

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

      {/* Results Summary */}
      {!isLoading && jobs.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
            Showing {jobs.length} of {totalJobs} jobs
          </Typography>
          {isSearchMode && (
            <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
              Search results for: "{searchQuery}"
            </Typography>
          )}
        </Box>
      )}

      {/* Jobs List */}
      {!isLoading && jobs.length > 0 && (
        <Grid container spacing={3}>
          {jobs.map((job) => (
            <Grid item xs={12} key={job.id}>
              <Card
                sx={{
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      {/* Job Title */}
                      <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 1 }}>
                        {job.title}
                      </Typography>

                      {/* Company Name */}
                      <Typography
                        variant='body2'
                        sx={{ color: theme.palette.text.secondary, mb: 1 }}
                      >
                        {job.company_name}
                      </Typography>

                      {/* Location */}
                      <Typography
                        variant='body2'
                        sx={{ color: theme.palette.text.secondary, mb: 2 }}
                      >
                        📍 {job.location}
                      </Typography>

                      {/* Job Description Preview */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant='body2' sx={{ mb: 1 }}>
                          {job.description?.substring(0, 200)}
                          {job.description && job.description.length > 200 && '...'}
                        </Typography>
                      </Box>

                      {/* Job Metadata Chips */}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {job.job_type && (
                          <Chip label={job.job_type} size='small' />
                        )}
                        {job.experience_level && (
                          <Chip label={job.experience_level} size='small' />
                        )}
                        {job.salary_range && (
                          <Chip label={job.salary_range} size='small' color='success' />
                        )}
                        {job.posted_date && (
                          <Chip 
                            label={`Posted: ${new Date(job.posted_date).toLocaleDateString()}`} 
                            size='small' 
                            variant='outlined'
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                      <Tooltip title="View in Dialog">
                        <IconButton
                          size='small'
                          onClick={() => setSelectedJobId(job.id)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Full Page">
                        <IconButton
                          size='small'
                          color='primary'
                          onClick={() => handleViewJobDetails(job.id)}
                        >
                          <OpenInNewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Job">
                        <IconButton
                          size='small'
                          color='error'
                          onClick={() => handleDeleteJob(job.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
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

      {/* No Results Message */}
      {!isLoading && jobs.length === 0 && (
        <Card sx={{ textAlign: 'center', p: 5 }}>
          <Typography variant='h6' sx={{ color: theme.palette.text.secondary }}>
            {isSearchMode 
              ? 'No jobs found matching your search criteria.' 
              : 'No jobs available. Start scraping to collect job data.'
            }
          </Typography>
          {isSearchMode && (
            <Button
              variant='outlined'
              onClick={resetToList}
              sx={{ mt: 2 }}
            >
              View All Jobs
            </Button>
          )}
        </Card>
      )}

      {/* Job Details Dialog */}
      <JobDetails
        jobId={selectedJobId}
        open={!!selectedJobId}
        onClose={() => setSelectedJobId(null)}
      />
    </Box>
  )
}

export default JobsSearch
