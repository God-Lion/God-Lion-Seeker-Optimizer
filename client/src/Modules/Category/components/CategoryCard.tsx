// src/Modules/CategoryManagement/components/CategoryCard.tsx
// ✅ REFACTORED: Now using shared hooks instead of direct API calls

import React from 'react'
import {
  Box,
  Card,
  CardHeader,
  Container,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { useCategories } from '@/shared/hooks'
import { ICategory } from 'src/lib/types'
import Banner2 from 'src/assets/images/1129.jpg'

// Custom Card Component
const CustomCard: React.FC<{ data: ICategory }> = ({ data }) => {
  return (
    <Card
      sx={{
        position: 'relative',
        backgroundColor: 'grey.800',
        color: '#FFF',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundImage: `url(${Banner2})`,
        maxWidth: 300,
        m: 2,
        transform: 'scale(0.9)',
        transition: 'transform 150ms ease-in, box-shadow 0.2s linear',
        '&:hover': {
          transform: 'scale(1)',
          boxShadow: '10px 10px 28px -2px rgba(0, 0, 0, 0.75)',
        },
      }}
    >
      <CardHeader
        title={
          <Typography component="span">
            {data.name}
          </Typography>
        }
      />
    </Card>
  )
}

// Main CategoryCard Component
const CategoryCard = () => {
  // ✅ Using shared hook instead of local service
  const {
    data: categories,
    isLoading: isLoadingCategories,
    error,
    refetch,
  } = useCategories()

  // Loading state
  if (isLoadingCategories) {
    return (
      <Container>
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  // Error state
  if (error) {
    return (
      <Container>
        <Box sx={{ mt: 3 }}>
          <Alert 
            severity="error"
            action={
              <Typography
                component="button"
                onClick={() => refetch()}
                sx={{ 
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                }}
              >
                Retry
              </Typography>
            }
          >
            {error.message || 'Failed to load categories'}
          </Alert>
        </Box>
      </Container>
    )
  }

  // Empty state
  const categoryData = categories?.data || []
  if (categoryData.length === 0) {
    return (
      <Container>
        <Box sx={{ mt: 3 }}>
          <Alert severity="info">
            No categories available at the moment.
          </Alert>
        </Box>
      </Container>
    )
  }

  // Success state
  return (
    <Container>
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Grid container spacing={2} justifyContent="space-around">
          {categoryData.map((category, index) => (
            <Grid item key={category.id || index}>
              <CustomCard data={category} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  )
}

export default CategoryCard
