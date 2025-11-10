import { Box, Container, Typography, IconButton, Link as HLInk } from '@mui/material'
import TwitterIcon from '@mui/icons-material/Twitter'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import FacebookIcon from '@mui/icons-material/Facebook'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        py: { xs: 5, sm: 10 },
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          textAlign: 'center',
        }}
      >
        {/* Navigation Links */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: { xs: 2, sm: 4 },
          }}
        >
          <HLInk
            component={Link}
            to='/privacy-policy'
            underline="none"
            sx={{
              fontSize: '0.875rem',
              color: 'text.secondary',
              transition: 'color 0.2s',
              '&:hover': {
                color: 'text.primary',
              },
            }}
          >
            Privacy Policy
          </HLInk>
          <HLInk
            component={Link}
            to='/terms-of-service'
            underline="none"
            sx={{
              fontSize: '0.875rem',
              color: 'text.secondary',
              transition: 'color 0.2s',
              '&:hover': {
                color: 'text.primary',
              },
            }}
          >
            Terms of Service
          </HLInk>
          <HLInk
            component={Link}
            to='/contact'
            underline="none"
            sx={{
              fontSize: '0.875rem',
              color: 'text.secondary',
              transition: 'color 0.2s',
              '&:hover': {
                color: 'text.primary',
              },
            }}
          >
            Contact Us
          </HLInk>
        </Box>

        {/* Social Media Icons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
          }}
        >
          <IconButton
            href="#"
            aria-label="Twitter"
            sx={{
              color: 'text.secondary',
              transition: 'color 0.2s',
              '&:hover': {
                color: 'text.primary',
              },
            }}
          >
            <TwitterIcon />
          </IconButton>
          <IconButton
            href="#"
            aria-label="LinkedIn"
            sx={{
              color: 'text.secondary',
              transition: 'color 0.2s',
              '&:hover': {
                color: 'text.primary',
              },
            }}
          >
            <LinkedInIcon />
          </IconButton>
          <IconButton
            href="#"
            aria-label="Facebook"
            sx={{
              color: 'text.secondary',
              transition: 'color 0.2s',
              '&:hover': {
                color: 'text.primary',
              },
            }}
          >
            <FacebookIcon />
          </IconButton>
        </Box>

        {/* Copyright */}
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.875rem',
            color: 'text.secondary',
          }}
        >
          © {new Date().getFullYear()} God Lion Seeker Optimizer. All rights reserved.
        </Typography>
      </Container>
    </Box>
  )
}
