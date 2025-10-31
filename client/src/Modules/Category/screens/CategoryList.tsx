// src/Modules/CategoryManagement/screens/CategoryList.tsx
// ✅ NEW: Advanced category list with search, filter, and actions

import React, { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  TextField,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useCategories } from '@/shared/hooks'
import { ICategory } from 'src/types'

const CategoryList = () => {
  const [searchTerm, setSearchTerm] = useState('')

  // ✅ Using shared hook with automatic caching
  const {
    data: categoriesResponse,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useCategories('', {
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })

  const categories = categoriesResponse?.data || []

  // Filter categories based on search
  const filteredCategories = categories.filter((category) =>
    category.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Category Management
          </Typography>
          <IconButton 
            onClick={() => refetch()} 
            disabled={isRefetching}
            color="primary"
          >
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* Search Bar */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Loading State */}
        {isLoading && (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert 
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Retry
              </Button>
            }
          >
            {error.message || 'Failed to load categories'}
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredCategories.length === 0 && (
          <Alert severity="info">
            {searchTerm
              ? `No categories found matching "${searchTerm}"`
              : 'No categories available'}
          </Alert>
        )}

        {/* Categories Grid */}
        {!isLoading && !error && filteredCategories.length > 0 && (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredCategories.length} of {categories.length} categories
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {filteredCategories.map((category) => (
                <Grid item xs={12} sm={6} md={4} key={category.id}>
                  <CategoryCard category={category} />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Box>
    </Container>
  )
}

// Category Card Component
interface CategoryCardProps {
  category: ICategory
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          {category.name}
        </Typography>
        
        {category.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {category.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            label={`ID: ${category.id}`} 
            size="small" 
            variant="outlined" 
          />
          {category.count && (
            <Chip 
              label={`${category.count} items`} 
              size="small" 
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      </CardContent>

      <CardActions>
        <Button size="small" color="primary">
          View Details
        </Button>
        <Button size="small" color="secondary">
          Edit
        </Button>
      </CardActions>
    </Card>
  )
}

export default CategoryList
