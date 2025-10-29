// src/Modules/Companies/screens/Companies.tsx

import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Link,
  TablePagination,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import BusinessIcon from '@mui/icons-material/Business'
import RefreshIcon from '@mui/icons-material/Refresh'
import ClearIcon from '@mui/icons-material/Clear'
import { useCompaniesManagement, useCompany } from '../hooks'
import { Company } from '../types'

const Companies: React.FC = (): React.ReactElement => {
  const theme = useTheme()
  
  // Use the business logic hook
  const {
    // State
    searchQuery,
    industryFilter,
    sizeFilter,
    currentPage,
    itemsPerPage,
    viewMode,
    
    // Data
    companies,
    totalCompanies,
    isLoading,
    error,
    
    // Actions
    setSearchQuery,
    setIndustryFilter,
    setSizeFilter,
    executeSearch,
    resetToList,
    setPage,
    setItemsPerPage,
    refresh,
    clearFilters,
    
    // Computed
    hasFilters,
    isSearchMode,
  } = useCompaniesManagement()

  // Local state for company details dialog
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Fetch selected company details
  const { data: companyData } = useCompany(selectedCompanyId, {
    enabled: showDetails && !!selectedCompanyId,
  })
  const selectedCompany = companyData?.data

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    executeSearch()
  }

  const handleResetSearch = () => {
    resetToList()
  }

  const handleViewCompany = (companyId: number) => {
    setSelectedCompanyId(companyId)
    setShowDetails(true)
  }

  const handleCloseDetails = () => {
    setSelectedCompanyId(null)
    setShowDetails(false)
  }

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage + 1) // MUI uses 0-based indexing
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setItemsPerPage(parseInt(event.target.value, 10))
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
          Companies
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon sx={{ fontSize: '2rem', color: theme.palette.primary.main }} />
          <Typography variant='h6' sx={{ color: theme.palette.text.secondary }}>
            {totalCompanies} companies
          </Typography>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <form onSubmit={handleSearch}>
            <Grid container spacing={2}>
              {/* Search Input */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Search Companies'
                  placeholder='Search by name or industry...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  variant='outlined'
                  size='small'
                />
              </Grid>

              {/* Industry Filter */}
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Industry</InputLabel>
                  <Select
                    value={industryFilter}
                    label='Industry'
                    onChange={(e) => setIndustryFilter(e.target.value)}
                  >
                    <MenuItem value=''>All Industries</MenuItem>
                    <MenuItem value='Technology'>Technology</MenuItem>
                    <MenuItem value='Finance'>Finance</MenuItem>
                    <MenuItem value='Healthcare'>Healthcare</MenuItem>
                    <MenuItem value='Education'>Education</MenuItem>
                    <MenuItem value='Retail'>Retail</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Company Size Filter */}
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Company Size</InputLabel>
                  <Select
                    value={sizeFilter}
                    label='Company Size'
                    onChange={(e) => setSizeFilter(e.target.value)}
                  >
                    <MenuItem value=''>All Sizes</MenuItem>
                    <MenuItem value='1-10'>1-10 employees</MenuItem>
                    <MenuItem value='11-50'>11-50 employees</MenuItem>
                    <MenuItem value='51-200'>51-200 employees</MenuItem>
                    <MenuItem value='201-500'>201-500 employees</MenuItem>
                    <MenuItem value='501-1000'>501-1000 employees</MenuItem>
                    <MenuItem value='1000+'>1000+ employees</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    type='submit'
                    variant='contained'
                    startIcon={<SearchIcon />}
                    disabled={isLoading}
                  >
                    Search
                  </Button>
                  
                  {(isSearchMode || hasFilters) && (
                    <Button
                      variant='outlined'
                      startIcon={<ClearIcon />}
                      onClick={() => {
                        handleResetSearch()
                        clearFilters()
                      }}
                      disabled={isLoading}
                    >
                      Clear All
                    </Button>
                  )}

                  <Button
                    variant='outlined'
                    startIcon={<RefreshIcon />}
                    onClick={refresh}
                    disabled={isLoading}
                  >
                    Refresh
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Companies Table */}
      {!isLoading && companies.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                {isSearchMode ? 'Search Results' : 'Companies List'}
              </Typography>
              {hasFilters && (
                <Chip 
                  label='Filtered' 
                  color='primary' 
                  size='small' 
                  onDelete={clearFilters}
                />
              )}
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Company</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Industry</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Size</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Headquarters</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Website</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow
                      key={company.id}
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {company.name}
                      </TableCell>
                      <TableCell>
                        {company.industry ? (
                          <Chip label={company.industry} size='small' variant='outlined' />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {company.company_size || '-'}
                      </TableCell>
                      <TableCell>
                        {company.headquarters || '-'}
                      </TableCell>
                      <TableCell>
                        {company.website ? (
                          <Link href={company.website} target='_blank' rel='noopener noreferrer'>
                            Visit Website
                          </Link>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align='center'>
                        <Tooltip title='View Details'>
                          <IconButton
                            size='small'
                            onClick={() => handleViewCompany(company.id)}
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

            {/* Pagination */}
            <TablePagination
              component='div'
              count={totalCompanies}
              page={currentPage - 1}
              onPageChange={handlePageChange}
              rowsPerPage={itemsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[10, 20, 50, 100]}
            />
          </CardContent>
        </Card>
      )}

      {/* No Results Message */}
      {!isLoading && companies.length === 0 && (
        <Card sx={{ textAlign: 'center', p: 5 }}>
          <Typography variant='h6' sx={{ color: theme.palette.text.secondary }}>
            {isSearchMode
              ? 'No companies found matching your search criteria.' 
              : hasFilters
              ? 'No companies match the selected filters.'
              : 'No companies available. Start scraping to collect company data.'
            }
          </Typography>
        </Card>
      )}

      {/* Company Details Dialog */}
      <Dialog
        open={showDetails}
        onClose={handleCloseDetails}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
            Company Details
          </Typography>
          <Button onClick={handleCloseDetails} size='small'>
            Close
          </Button>
        </DialogTitle>

        <DialogContent dividers>
          {selectedCompany && (
            <Box>
              {/* Company Header */}
              <Box sx={{ mb: 3 }}>
                <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 1 }}>
                  {selectedCompany.name}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {selectedCompany.industry && (
                    <Chip label={selectedCompany.industry} color='primary' />
                  )}
                  {selectedCompany.company_size && (
                    <Chip label={selectedCompany.company_size} variant='outlined' />
                  )}
                </Box>

                {selectedCompany.website && (
                  <Button
                    variant='contained'
                    href={selectedCompany.website}
                    target='_blank'
                    rel='noopener noreferrer'
                    sx={{ mb: 2 }}
                  >
                    Visit Website
                  </Button>
                )}
              </Box>

              {/* Company Information */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 2 }}>
                        Company Information
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {selectedCompany.headquarters && (
                          <Box>
                            <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
                              Headquarters
                            </Typography>
                            <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                              {selectedCompany.headquarters}
                            </Typography>
                          </Box>
                        )}
                        
                        {selectedCompany.founded_year && (
                          <Box>
                            <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
                              Founded
                            </Typography>
                            <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                              {selectedCompany.founded_year}
                            </Typography>
                          </Box>
                        )}

                        {selectedCompany.linkedin_url && (
                          <Box>
                            <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
                              LinkedIn
                            </Typography>
                            <Link 
                              href={selectedCompany.linkedin_url} 
                              target='_blank' 
                              rel='noopener noreferrer'
                            >
                              View LinkedIn Profile
                            </Link>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 2 }}>
                        Description
                      </Typography>
                      {selectedCompany.description ? (
                        <Typography 
                          variant='body1' 
                          sx={{ 
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.6,
                          }}
                        >
                          {selectedCompany.description}
                        </Typography>
                      ) : (
                        <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
                          No description available
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDetails}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Companies
