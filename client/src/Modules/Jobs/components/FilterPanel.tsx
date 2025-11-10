// src/Modules/Jobs/components/FilterPanel.tsx
import React from 'react'
import {
  TextField,
  MenuItem,
  Grid,
  Button,
  Box,
  Typography,
} from '@mui/material'
import { JobSearch } from '@/types/job'

interface FilterPanelProps {
  filters: JobSearch
  onFilterChange: (filters: JobSearch) => void
  onReset: () => void
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      [event.target.name]: event.target.value,
    })
  }

  return (
    <Box>
      <Typography variant='h6' sx={{ mb: 2 }}>
        Filters
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label='Location'
            name='location'
            value={filters.location || ''}
            onChange={handleChange}
            variant='outlined'
            size='small'
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label='Company'
            name='company'
            value={filters.company || ''}
            onChange={handleChange}
            variant='outlined'
            size='small'
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            select
            label='Date Posted'
            name='date_posted'
            value={filters.date_posted || 'all'}
            onChange={handleChange}
            variant='outlined'
            size='small'
          >
            <MenuItem value='all'>All Time</MenuItem>
            <MenuItem value='past_24_hours'>Past 24 Hours</MenuItem>
            <MenuItem value='past_week'>Past Week</MenuItem>
            <MenuItem value='past_month'>Past Month</MenuItem>
          </TextField>
        </Grid>
      </Grid>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={onReset} size='small'>
          Reset Filters
        </Button>
      </Box>
    </Box>
  )
}

export default FilterPanel
