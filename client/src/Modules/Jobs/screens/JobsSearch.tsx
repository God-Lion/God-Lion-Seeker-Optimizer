// src/Modules/Jobs/screens/JobsSearch.tsx
import React, { useRef, useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Card,
  CircularProgress,
  Alert,
  Pagination,
  Typography,
  Grid,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
// import { useNavigate } from 'react-router-dom'
import SearchIcon from '@mui/icons-material/Search'
import { useVirtualizer } from '@tanstack/react-virtual'

import { useJobsManagement } from '../hooks/useJobsManagement'
import { useJobs } from '@/store'
import { applyForJob } from '@/services/api/jobs.api'
import FilterPanel from '../components/FilterPanel'
import JobCard from '../components/JobCard'
import JobDetails from './JobDetails' // Import the JobDetails component
import { Job } from '@/types/job'

const JobsSearch: React.FC = () => {
  const theme = useTheme()
  // const navigate = useNavigate() // Commented out - will be used for future navigation

  // Business logic hook
  const {
    searchQuery,
    filters,
    currentPage,
    jobs,
    totalJobs,
    totalPages,
    isLoading,
    error,
    setSearchQuery,
    setFilters,
    executeSearch,
    resetToList,
    setPage,
    // refresh, // Commented out - available for manual refresh functionality
    isSearchMode,
  } = useJobsManagement(20)

  // Zustand store for saved jobs
  const { saveJob, unsaveJob, savedJobs } = useJobs()
  const isJobSaved = (jobId: number) => savedJobs.some((job) => job.id === jobId)

  // State for the JobDetails dialog
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)

  // Virtualizer for the jobs list
  const parentRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: jobs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300,
    overscan: 5,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    executeSearch()
  }

  const handleApply = async (job: Job) => {
    try {
      // This is a simplified application process.
      // In a real-world scenario, you would likely have a form
      // to collect a resume, cover letter, etc.
      const response = await applyForJob({
        jobId: job.id,
        // @ts-ignore
        resume: new File([], 'resume.pdf'), // Placeholder for resume file
      })
      console.log('Application response:', response) // Log the response
      alert(`Successfully applied for ${job.title}`)
    } catch (error) {
      alert(`Failed to apply for ${job.title}`)
      console.error(error)
    }
  }

  const handleViewDetails = (jobId: number) => {
    setSelectedJobId(jobId)
  }

  const handleCloseDetails = () => {
    setSelectedJobId(null)
  }

  return (
    <Box>
      {/* Header */}
      <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 3 }}>
        Job Offers
      </Typography>

      {/* Search and Filter Form */}
      <Card sx={{ mb: 4, p: 3, backgroundColor: theme.palette.background.paper }}>
        <form onSubmit={handleSearch}>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label='Job Title or Keyword'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant='outlined'
                size='small'
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant='contained'
                color='primary'
                type='submit'
                startIcon={<SearchIcon />}
                disabled={!searchQuery.trim()}
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </form>
        <Box sx={{ mt: 3 }}>
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            onReset={resetToList}
          />
        </Box>
      </Card>

      {/* Error and Loading States */}
      {error && <Alert severity='error' sx={{ mb: 3 }}>{error}</Alert>}
      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>}

      {/* Results Summary */}
      {!isLoading && jobs.length > 0 && (
        <Typography variant='body2' sx={{ mb: 2, color: theme.palette.text.secondary }}>
          Showing {jobs.length} of {totalJobs} jobs
        </Typography>
      )}

      {/* Jobs List */}
      <Box ref={parentRef} sx={{ height: '800px', overflow: 'auto' }}>
        <Box sx={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const job = jobs[virtualItem.index]
            if (!job) return null
            return (
              <Box
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                  padding: '10px 0',
                }}
              >
                <JobCard
                  job={job}
                  onSave={saveJob}
                  onUnsave={unsaveJob}
                  onApply={handleApply}
                  isSaved={isJobSaved(job.id)}
                  onViewDetails={() => handleViewDetails(job.id)}
                />
              </Box>
            )
          })}
        </Box>
      </Box>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_e, p) => setPage(p)}
            color='primary'
          />
        </Box>
      )}

      {/* No Results Message */}
      {!isLoading && jobs.length === 0 && (
        <Card sx={{ textAlign: 'center', p: 5 }}>
          <Typography variant='h6'>
            {isSearchMode ? 'No jobs found.' : 'No jobs available.'}
          </Typography>
        </Card>
      )}

      {/* Job Details Dialog */}
      <JobDetails
        jobId={selectedJobId}
        open={!!selectedJobId}
        onClose={handleCloseDetails}
      />
    </Box>
  )
}

export default JobsSearch
