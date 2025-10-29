import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import { Link } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'

const NotFound: React.FC = (): React.ReactElement => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        gap: 3,
      }}
    >
      <Typography
        variant='h1'
        sx={{
          fontSize: { xs: '3rem', md: '5rem' },
          fontWeight: 'bold',
          color: theme.palette.primary.main,
        }}
      >
        404
      </Typography>

      <Typography
        variant='h4'
        sx={{
          fontWeight: 600,
          color: theme.palette.text.primary,
          mb: 2,
        }}
      >
        Page Not Found
      </Typography>

      <Typography
        variant='body1'
        sx={{
          color: theme.palette.text.secondary,
          maxWidth: '600px',
          fontSize: '1.1rem',
          mb: 3,
        }}
      >
        The page you're looking for doesn't exist or has been moved. 
        Let's get you back on track.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          component={Link}
          to='/'
          variant='contained'
          color='primary'
          size='large'
        >
          Go Home
        </Button>
        <Button
          component={Link}
          to='/jobs'
          variant='outlined'
          color='primary'
          size='large'
        >
          Browse Jobs
        </Button>
      </Box>
    </Box>
  )
}

export default NotFound
