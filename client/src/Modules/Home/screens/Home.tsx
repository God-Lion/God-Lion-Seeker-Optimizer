import { Container, Paper, Typography, Box, Button, Card, CardContent, Chip, alpha } from '@mui/material'
import Grid from '@mui/material/Grid'
import { useNavigate } from 'react-router-dom'
import WorkOutlineIcon from '@mui/icons-material/WorkOutline'
import SearchIcon from '@mui/icons-material/Search'
import BarChartIcon from '@mui/icons-material/BarChart'
import BusinessIcon from '@mui/icons-material/Business'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import SpeedIcon from '@mui/icons-material/Speed'
import SecurityIcon from '@mui/icons-material/Security'
import Banner from '../components/Banner'
import { GuestBanner } from 'src/components/common'
import { useGuest } from 'src/store'


const aboutSection = {
  title: 'Transform Your Job Search Experience',
  description: `Harness the power of intelligent automation and data-driven insights. 
  Our cutting-edge platform empowers job seekers, recruiters, and market analysts 
  with real-time data aggregation, advanced analytics, and comprehensive market intelligence 
  to make smarter career decisions.`,
}

const features = [
  {
    icon: <SearchIcon sx={{ fontSize: 48 }} />,
    title: 'Smart Job Search',
    description: 'Advanced search algorithms to find your perfect opportunity',
    link: '/jobs',
  },
  {
    icon: <WorkOutlineIcon sx={{ fontSize: 48 }} />,
    title: 'Automated Scraper',
    description: 'AI-powered data collection from multiple platforms',
    link: '/scraper',
  },
  {
    icon: <BarChartIcon sx={{ fontSize: 48 }} />,
    title: 'Market Analytics',
    description: 'Deep insights into job market trends and patterns',
    link: '/statistics',
  },
  {
    icon: <BusinessIcon sx={{ fontSize: 48 }} />,
    title: 'Company Insights',
    description: 'Comprehensive profiles and hiring trends analysis',
    link: '/companies',
  },
]

const benefits = [
  {
    icon: <TrendingUpIcon />,
    title: 'Real-Time Updates',
    description: 'Stay ahead with instant job posting notifications',
  },
  {
    icon: <SpeedIcon />,
    title: 'Lightning Fast',
    description: 'Optimized performance for seamless experience',
  },
  {
    icon: <SecurityIcon />,
    title: 'Secure & Private',
    description: 'Your data is protected with enterprise-grade security',
  },
]


export default function Home() {
  const navigate = useNavigate()
  const { isGuest } = useGuest()

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth='lg' sx={{ py: 4 }}>
        {/* Guest Mode Banner */}
        {isGuest && (
          <Box sx={{ mb: 3 }}>
            <GuestBanner 
              variant="minimal"
              message="Create a free account to unlock all features and save your job searches!"
            />
          </Box>
        )}
        {/* Hero Banner Section */}
        <Box sx={{ mb: 8 }}>
          <Banner />
        </Box>

        {/* Features Grid with Modern Cards */}
        <Box sx={{ mb: 10 }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant='h3'
              sx={{
                fontWeight: 700,
                mb: 2,
                background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Powerful Features
            </Typography>
            <Typography variant='h6' color='text.secondary' sx={{ maxWidth: 600, mx: 'auto' }}>
              Everything you need to navigate the modern job market
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'visible',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-12px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                      borderColor: 'primary.main',
                      '& .feature-icon': {
                        transform: 'scale(1.1) rotate(5deg)',
                      },
                      '& .feature-bg': {
                        opacity: 0.15,
                      },
                    },
                  }}
                  onClick={() => navigate(feature.link)}
                >
                  {/* Background Gradient Effect */}
                  <Box
                    className='feature-bg'
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '120px',
                      background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      opacity: 0.08,
                      transition: 'opacity 0.4s ease',
                      borderRadius: '4px 4px 0 0',
                    }}
                  />

                  <CardContent sx={{ flexGrow: 1, p: 3, textAlign: 'center', position: 'relative' }}>
                    {/* Icon Container */}
                    <Box
                      className='feature-icon'
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 80,
                        height: 80,
                        borderRadius: '20px',
                        background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        color: 'white',
                        mb: 2.5,
                        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                      }}
                    >
                      {feature.icon}
                    </Box>

                    <Typography variant='h6' gutterBottom sx={{ fontWeight: 700, mb: 1.5 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.7 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* About Section with Modern Layout */}
        <Grid container spacing={5} sx={{ mb: 10 }}>
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                p: 5,
                bgcolor: 'background.paper',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
              }}
            >
              <Chip
                label='ABOUT THE PLATFORM'
                size='small'
                sx={{
                  mb: 3,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  fontWeight: 600,
                }}
              />
              <Typography variant='h4' gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                {aboutSection.title}
              </Typography>
              <Typography variant='body1' paragraph sx={{ lineHeight: 1.9, color: 'text.secondary', mb: 4 }}>
                {aboutSection.description}
              </Typography>

              {/* Benefits List */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {benefits.map((benefit, index) => (
                  <Grid item xs={12} key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                          flexShrink: 0,
                        }}
                      >
                        {benefit.icon}
                      </Box>
                      <Box>
                        <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 0.5 }}>
                          {benefit.title}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {benefit.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant='contained'
                  size='large'
                  startIcon={<SearchIcon />}
                  onClick={() => navigate('/jobs')}
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                    '&:hover': {
                      boxShadow: (theme) => `0 12px 32px ${alpha(theme.palette.primary.main, 0.5)}`,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Start Searching Jobs
                </Button>
                <Button
                  variant='outlined'
                  size='large'
                  startIcon={<BarChartIcon />}
                  onClick={() => navigate('/statistics')}
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  View Analytics
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Stats Card with Gradient */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              sx={{
                p: 5,
                borderRadius: 3,
                height: '100%',
                background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: (theme) => `0 20px 60px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              {/* Decorative Elements */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.1)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -30,
                  left: -30,
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.08)',
                }}
              />

              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant='h5' gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
                  Platform Statistics
                </Typography>

                {/* Stat Items */}
                {[
                  { number: '10,000+', label: 'Active Job Listings', icon: <WorkOutlineIcon /> },
                  { number: '500+', label: 'Partner Companies', icon: <BusinessIcon /> },
                  { number: '24/7', label: 'Real-Time Monitoring', icon: <SpeedIcon /> },
                ].map((stat, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 4,
                      pb: index < 2 ? 4 : 0,
                      borderBottom: index < 2 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 36,
                          height: 36,
                          borderRadius: '10px',
                          bgcolor: 'rgba(255,255,255,0.2)',
                        }}
                      >
                        {stat.icon}
                      </Box>
                      <Typography variant='h3' sx={{ fontWeight: 800, letterSpacing: '-1px' }}>
                        {stat.number}
                      </Typography>
                    </Box>
                    <Typography variant='body1' sx={{ opacity: 0.95, fontWeight: 500 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                ))}

                <Box
                  sx={{
                    mt: 4,
                    p: 3,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Typography variant='body2' sx={{ fontWeight: 500, mb: 1 }}>
                    🚀 Updated in real-time
                  </Typography>
                  <Typography variant='caption' sx={{ opacity: 0.9 }}>
                    Our platform continuously monitors and updates job listings to ensure you never miss an opportunity
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Call to Action Section - Theme Aware */}
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative background gradient - theme aware */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: (theme) => {
                const primaryRgb = theme.palette.primary.main.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '212, 175, 55'
                const secondaryRgb = theme.palette.secondary.main.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '139, 69, 19'
                return theme.palette.mode === 'light'
                  ? `linear-gradient(135deg, rgba(${primaryRgb}, 0.08) 0%, rgba(${secondaryRgb}, 0.08) 100%)`
                  : `linear-gradient(135deg, rgba(${primaryRgb}, 0.15) 0%, rgba(${secondaryRgb}, 0.15) 100%)`
              },
              zIndex: 0,
            }}
          />
          
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography 
              variant='h4' 
              gutterBottom 
              sx={{ 
                fontWeight: 700, 
                mb: 2,
                color: 'text.primary',
              }}
            >
              Ready to Get Started?
            </Typography>
            <Typography 
              variant='body1' 
              color='text.secondary' 
              sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
            >
              Join thousands of job seekers and recruiters who trust our platform for their career journey
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant='contained'
                size='large'
                onClick={() => navigate('/scraper')}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                  '&:hover': {
                    boxShadow: (theme) => `0 12px 32px ${alpha(theme.palette.primary.main, 0.5)}`,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Start Scraping
              </Button>
              <Button
                variant='outlined'
                size='large'
                onClick={() => navigate('/jobs')}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Browse Jobs
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}
