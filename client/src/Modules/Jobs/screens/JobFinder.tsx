// src/Modules/Jobs/screens/JobFinder.tsx
import React, { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  TextField,
  IconButton,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Chip,
  Card,
  CardContent,
  Skeleton,
  Menu,
  MenuItem,
  useMediaQuery,
  Stack,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import WorkOutlineIcon from '@mui/icons-material/WorkOutline'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import BookmarkIcon from '@mui/icons-material/Bookmark'

import { useJobsManagement } from '../hooks/useJobsManagement'
import { useJobs } from '@/store'
import { applyForJob } from '@/services/api/jobs.api'
import { Job } from '@/types/job'
import JobDetails from './JobDetails'

const JobFinder: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

  // Mobile drawer state
  const [_, setMobileDrawerOpen] = useState(false)

  // Business logic hook
  const {
    jobs,
    totalJobs,
    isLoading,
    setFilters,
    executeSearch,
    resetToList,
  } = useJobsManagement(20)

  // Zustand store for saved jobs
  const { saveJob, unsaveJob, savedJobs } = useJobs()
  const isJobSaved = (jobId: number) => savedJobs.some((job) => job.id === jobId)

  // State for job details dialog
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)

  // Sort menu state
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null)
  const [sortBy, setSortBy] = useState('Relevance')

  // Filter state
  const [datePosted, setDatePosted] = useState('past_24_hours')
  const [location, setLocation] = useState('')
  const [jobTypes, setJobTypes] = useState({
    fullTime: true,
    partTime: false,
    contract: false,
    internship: false,
  })

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    executeSearch()
  }

  const handleApply = async (job: Job) => {
    try {
      const response = await applyForJob({
        jobId: job.id,
        // @ts-ignore
        resume: new File([], 'resume.pdf'),
      })
      console.log('Application response:', response)
      alert(`Successfully applied for ${job.title}`)
    } catch (error) {
      alert(`Failed to apply for ${job.title}`)
      console.error(error)
    }
  }

  const handleViewDetails = (jobId: number) => {
    setSelectedJobId(jobId)
  }

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget)
  }

  const handleSortClose = (value?: string) => {
    setSortAnchorEl(null)
    if (value) {
      setSortBy(value)
    }
  }

  const handleJobTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setJobTypes({
      ...jobTypes,
      [event.target.name]: event.target.checked,
    })
  }

  const handleApplyFilters = () => {
    setFilters({
      location: location || undefined,
      date_posted: datePosted as any,
    })
    handleSearch()
    if (isMobile) {
      setMobileDrawerOpen(false)
    }
  }

  const handleResetFilters = () => {
    setDatePosted('past_24_hours')
    setLocation('')
    setJobTypes({
      fullTime: true,
      partTime: false,
      contract: false,
      internship: false,
    })
    resetToList()
    if (isMobile) {
      setMobileDrawerOpen(false)
    }
  }

  const FilterContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, borderBottom: '1px solid #2a2a2a' }}>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 0.5 }}>
          Filters
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Refine your search
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <Accordion 
          defaultExpanded 
          elevation={0}
          sx={{
            bgcolor: 'transparent',
            '&:before': { display: 'none' },
            borderBottom: '1px solid #2a2a2a',
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ px: 3, py: 1.5 }}
          >
            <Typography variant="body1" fontWeight="500">
              Date Posted
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pt: 0, pb: 2 }}>
            <RadioGroup value={datePosted} onChange={(e) => setDatePosted(e.target.value)}>
              <FormControlLabel
                value="past_24_hours"
                control={<Radio size="small" sx={{ color: '#d4af37', '&.Mui-checked': { color: '#d4af37' } }} />}
                label={<Typography variant="body2">Last 24 hours</Typography>}
                sx={{ mb: 0.5 }}
              />
              <FormControlLabel
                value="past_week"
                control={<Radio size="small" sx={{ color: '#d4af37', '&.Mui-checked': { color: '#d4af37' } }} />}
                label={<Typography variant="body2">Last 7 days</Typography>}
                sx={{ mb: 0.5 }}
              />
              <FormControlLabel
                value="past_month"
                control={<Radio size="small" sx={{ color: '#d4af37', '&.Mui-checked': { color: '#d4af37' } }} />}
                label={<Typography variant="body2">Last 30 days</Typography>}
                sx={{ mb: 0 }}
              />
            </RadioGroup>
          </AccordionDetails>
        </Accordion>

        <Accordion 
          elevation={0}
          sx={{
            bgcolor: 'transparent',
            '&:before': { display: 'none' },
            borderBottom: '1px solid #2a2a2a',
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ px: 3, py: 1.5 }}
          >
            <Typography variant="body1" fontWeight="500">
              Location
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pt: 0, pb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="City, state, or zip"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#1e1e1e',
                  '& fieldset': { borderColor: '#3a3a3a' },
                  '&:hover fieldset': { borderColor: '#4a4a4a' },
                  '&.Mui-focused fieldset': { borderColor: '#d4af37' },
                },
              }}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion 
          elevation={0}
          sx={{
            bgcolor: 'transparent',
            '&:before': { display: 'none' },
            borderBottom: '1px solid #2a2a2a',
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ px: 3, py: 1.5 }}
          >
            <Typography variant="body1" fontWeight="500">
              Job Type
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pt: 0, pb: 2 }}>
            <Stack spacing={0.5}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={jobTypes.fullTime}
                    onChange={handleJobTypeChange}
                    name="fullTime"
                    size="small"
                    sx={{ color: '#d4af37', '&.Mui-checked': { color: '#d4af37' } }}
                  />
                }
                label={<Typography variant="body2">Full-time</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={jobTypes.partTime}
                    onChange={handleJobTypeChange}
                    name="partTime"
                    size="small"
                    sx={{ color: '#d4af37', '&.Mui-checked': { color: '#d4af37' } }}
                  />
                }
                label={<Typography variant="body2">Part-time</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={jobTypes.contract}
                    onChange={handleJobTypeChange}
                    name="contract"
                    size="small"
                    sx={{ color: '#d4af37', '&.Mui-checked': { color: '#d4af37' } }}
                  />
                }
                label={<Typography variant="body2">Contract</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={jobTypes.internship}
                    onChange={handleJobTypeChange}
                    name="internship"
                    size="small"
                    sx={{ color: '#d4af37', '&.Mui-checked': { color: '#d4af37' } }}
                  />
                }
                label={<Typography variant="body2">Internship</Typography>}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Box>

      <Box sx={{ p: 3, borderTop: '1px solid #2a2a2a' }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleApplyFilters}
          sx={{
            bgcolor: '#d4af37',
            color: '#000',
            fontWeight: '600',
            textTransform: 'none',
            py: 1.25,
            mb: 1.5,
            '&:hover': { bgcolor: '#c09f2f' },
          }}
        >
          Apply Filters
        </Button>
        <Button
          fullWidth
          variant="text"
          onClick={handleResetFilters}
          sx={{
            color: '#999',
            textTransform: 'none',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
          }}
        >
          Reset
        </Button>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh',}}>
      {/* Top Navigation Bar */}
      {/* <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: '#1a1a1a',
          borderBottom: '1px solid #2a2a2a',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 4, lg: 6 }, py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 4 }}>
            <SearchIcon sx={{ color: '#d4af37', fontSize: 32 }} />
            <Typography variant="h6" fontWeight="700" sx={{ letterSpacing: '-0.5px' }}>
              JobFinder
            </Typography>
          </Box>

          <Stack direction="row" spacing={4} sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { color: '#d4af37' } }}>
              Find Jobs
            </Typography>
            <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { color: '#d4af37' } }}>
              My Applications
            </Typography>
            <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { color: '#d4af37' } }}>
              Settings
            </Typography>
          </Stack>

          <Box sx={{ flex: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Search by job title, company, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              sx={{
                width: { xs: 200, sm: 300, md: 400 },
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#0d0d0d',
                  color: '#fff',
                  fontSize: '0.875rem',
                  '& fieldset': { border: 'none' },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#666', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="contained"
              sx={{
                bgcolor: '#d4af37',
                color: '#000',
                fontWeight: '600',
                textTransform: 'none',
                px: 3,
                display: { xs: 'none', sm: 'block' },
                '&:hover': { bgcolor: '#c09f2f' },
              }}
            >
              Post a Job
            </Button>

            {isMobile && (
              <IconButton onClick={() => setMobileDrawerOpen(true)} sx={{ color: '#fff' }}>
                <FilterListIcon />
              </IconButton>
            )}

            <Avatar
              sx={{ width: 40, height: 40, cursor: 'pointer', bgcolor: '#2a2a2a' }}
            />
          </Box>
        </Toolbar>
      </AppBar> */}

      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Desktop Side Filter Panel */}
        {!isMobile && (
          <Box
            sx={{
              width: 310,
              borderRight: '1px solid #2a2a2a',
              bgcolor: '#1a1a1a',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <FilterContent />
          </Box>
        )}

        {/* Mobile Filter Drawer */}
        {/* <Drawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          PaperProps={{
            sx: { width: 310, bgcolor: '#1a1a1a', color: '#fff' },
          }}
        >
          <FilterContent />
        </Drawer> */}

        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: 'auto',
          }}
        >
          <Container  >
            {/* List Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight="400">
                Showing {totalJobs.toLocaleString()} job results
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Sort by:
                </Typography>
                <Button
                  onClick={handleSortClick}
                  endIcon={<ExpandMoreIcon />}
                  sx={{
                    color: '#fff',
                    textTransform: 'none',
                    minWidth: 120,
                    justifyContent: 'space-between',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                  }}
                >
                  {sortBy}
                </Button>
                <Menu
                  anchorEl={sortAnchorEl}
                  open={Boolean(sortAnchorEl)}
                  onClose={() => handleSortClose()}
                  PaperProps={{
                    sx: { bgcolor: '#2a2a2a', color: '#fff' },
                  }}
                >
                  <MenuItem onClick={() => handleSortClose('Relevance')}>Relevance</MenuItem>
                  <MenuItem onClick={() => handleSortClose('Date')}>Date</MenuItem>
                  <MenuItem onClick={() => handleSortClose('Salary')}>Salary</MenuItem>
                </Menu>
              </Box>
            </Box>

            {/* Job List */}
            <Stack spacing={2.5}>
              {isLoading ? (
                // Loading Skeletons
                Array.from({ length: 3 }).map((_, idx) => (
                  <Card
                    key={idx}
                    sx={{
                      // bgcolor: '#1a1a1a',
                      // border: '1px solid #2a2a2a',
                      borderRadius: 2,
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', gap: 2.5 }}>
                        <Skeleton 
                          variant="rectangular" 
                          width={56} 
                          height={56} 
                          sx={{ borderRadius: 1.5, bgcolor: '#2a2a2a' }} 
                        />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton variant="text" width="60%" height={32} sx={{ bgcolor: '#2a2a2a' }} />
                          <Skeleton variant="text" width="40%" height={24} sx={{ bgcolor: '#2a2a2a', mt: 0.5 }} />
                          <Skeleton variant="text" width="100%" sx={{ bgcolor: '#2a2a2a', mt: 2 }} />
                          <Skeleton variant="text" width="85%" sx={{ bgcolor: '#2a2a2a' }} />
                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Skeleton variant="rounded" width={90} height={28} sx={{ bgcolor: '#2a2a2a' }} />
                            <Skeleton variant="rounded" width={120} height={28} sx={{ bgcolor: '#2a2a2a' }} />
                            <Skeleton variant="rounded" width={70} height={28} sx={{ bgcolor: '#2a2a2a' }} />
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              ) : jobs.length === 0 ? (
                // Empty State
                <Paper
                  sx={{
                    bgcolor: '#1a1a1a',
                    border: '2px dashed #2a2a2a',
                    borderRadius: 2,
                    p: 8,
                    textAlign: 'center',
                  }}
                >
                  <WorkOutlineIcon sx={{ fontSize: 64, color: '#3a3a3a', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No Jobs Found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    We couldn't find any jobs matching your search. Try adjusting your filters.
                  </Typography>
                </Paper>
              ) : (
                // Job Cards
                jobs.map((job) => (
                  <Card
                    key={job.id}
                    sx={{
                      bgcolor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: '#3a3a3a',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', gap: 2.5, mb: 3 }}>
                        {/* Company Logo */}
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            bgcolor: '#2a2a2a',
                            borderRadius: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <WorkOutlineIcon sx={{ color: '#d4af37', fontSize: 28 }} />
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box>
                              <Typography
                                variant="h6"
                                fontWeight="600"
                                sx={{
                                  cursor: 'pointer',
                                  fontSize: '1.125rem',
                                  mb: 0.5,
                                  '&:hover': { color: '#d4af37' },
                                }}
                                onClick={() => handleViewDetails(job.id)}
                              >
                                {job.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {job.company_name} • {job.location}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', ml: 2 }}>
                              Posted {job.posted_date ? new Date(job.posted_date).toLocaleDateString() : 'recently'}
                            </Typography>
                          </Box>

                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              my: 2,
                              lineHeight: 1.6,
                            }}
                          >
                            {job.description?.substring(0, 200)}
                            {job.description && job.description.length > 200 && '...'}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {job.job_type && (
                              <Chip
                                label={job.job_type}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(212, 175, 55, 0.15)',
                                  color: '#d4af37',
                                  fontWeight: '500',
                                  fontSize: '0.75rem',
                                  border: 'none',
                                }}
                              />
                            )}
                            {job.experience_level && (
                              <Chip
                                label={job.experience_level}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(212, 175, 55, 0.15)',
                                  color: '#d4af37',
                                  fontWeight: '500',
                                  fontSize: '0.75rem',
                                  border: 'none',
                                }}
                              />
                            )}
                            {job.salary_range && (
                              <Chip
                                label={job.salary_range}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(212, 175, 55, 0.15)',
                                  color: '#d4af37',
                                  fontWeight: '500',
                                  fontSize: '0.75rem',
                                  border: 'none',
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pt: 2, borderTop: '1px solid #2a2a2a' }}>
                        <IconButton
                          size="small"
                          onClick={() => (isJobSaved(job.id) ? unsaveJob(job.id) : saveJob(job))}
                          sx={{ color: isJobSaved(job.id) ? '#d4af37' : '#666' }}
                        >
                          {isJobSaved(job.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                        </IconButton>
                        <Button
                          size="medium"
                          onClick={() => handleViewDetails(job.id)}
                          sx={{
                            color: '#fff',
                            textTransform: 'none',
                            fontWeight: '500',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          size="medium"
                          variant="contained"
                          onClick={() => handleApply(job)}
                          sx={{
                            bgcolor: '#d4af37',
                            color: '#000',
                            fontWeight: '600',
                            textTransform: 'none',
                            px: 3,
                            '&:hover': { bgcolor: '#c09f2f' },
                          }}
                        >
                          Apply Now
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          </Container>
        </Box>
      </Box>

      {/* Job Details Dialog */}
      <JobDetails jobId={selectedJobId} open={!!selectedJobId} onClose={() => setSelectedJobId(null)} />
    </Box>
  )
}

export default JobFinder
