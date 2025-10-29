import React from 'react'
import { Helmet } from 'react-helmet-async'
import themeConfig from 'src/configs/themeConfig'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Container,
  Backdrop,
  CircularProgress,
  Typography,
  Box,
  Button,
  Paper,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { AxiosError, AxiosResponse } from 'axios'
import { verificationEmailHandle } from 'src/services/app'
import MAlert from 'src/components/Alert'

export default function VerificationEmail() {
  const theme = useTheme()
  const navigate = useNavigate()
  const { email } = useParams()
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  let [searchParams, _setSearchParams] = useSearchParams()
  const signature = searchParams.get('signature')

  const [loading, setLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<AxiosError>()

  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response: AxiosResponse = await verificationEmailHandle(
          email || '',
          signature ?? '',
        )
        if (response.status === 200) navigate('/')
      } catch (error) {
        setError(error as AxiosError)
        console.log('error ', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [email, navigate, signature])

  return (
    <React.Fragment>
      <Helmet>
        <title>Email Verification - {themeConfig.templateName}</title>
        <meta
          name='description'
          content={`Verify your email on ${themeConfig.templateName}`}
        />
        <meta
          name='keywords'
          content={`email verification, ${themeConfig.templateName}`}
        />
      </Helmet>
      <Container
        component='main'
        maxWidth='lg'
        sx={{
          width: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          height: '100vh',
          margin: 0,
          [theme.breakpoints.up('lg')]: {
            width: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            height: '100vh',
            margin: 0,
          },
          [theme.breakpoints.up('md')]: {
            width: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            height: '100vh',
            margin: 0,
          },
          [theme.breakpoints.up('sm')]: {
            width: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            height: '100vh',
            margin: 0,
          },
          [theme.breakpoints.up('xl')]: {
            width: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            height: '100vh',
            margin: 0,
          },
          [theme.breakpoints.up('xs')]: {
            width: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            height: '100vh',
            margin: 0,
          },
        }}
      >
        <Paper
          variant='outlined'
          sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}
        >
          <Backdrop
            sx={{
              color: '#FFFFFF',
              zIndex: (theme) => theme.zIndex.drawer + 10,
            }}
            open={loading}
          >
            <CircularProgress color='inherit' />
          </Backdrop>
          <MAlert severity='error' sx={{ width: '100%' }}>
            <Box>
              {error?.code === 'ERR_NETWORK' && (
                <Typography
                  variant='body1'
                  component='body'
                  bgcolor='transparent'
                  pt={1}
                  color='#FFF'
                >
                  {error.message}
                </Typography>
              )}
              <Typography
                component='body'
                pt={1}
                bgcolor='transparent'
                color='#FFF'
              >
                Expired or Invalid Password Reset Link
              </Typography>
              <Typography
                component='body'
                pt={1}
                bgcolor='transparent'
                color='#FFF'
              >
                We're sorry, but the password reset link you're trying to use
                has either expired or is not valid. Password reset links are
                only valid for a limited time for security reasons.
              </Typography>
              <Typography
                component='body'
                pt={1}
                bgcolor='transparent'
                color='#FFF'
              >
                Please request a new password reset link by visiting the forgot
                password page and submitting your email address again. Make sure
                to use the latest link sent to your email inbox.
              </Typography>
              <Typography
                component='body'
                pt={1}
                bgcolor='transparent'
                color='#FFF'
              >
                If you continue to experience issues, please contact our support
                team at{' '}
                <Link to='mailto:support@example.com'>support@example.com</Link>{' '}
                for further assistance.
              </Typography>
              <Typography
                component='body'
                pt={1}
                bgcolor='transparent'
                color='#FFF'
                noWrap
              >
                We apologize for any inconvenience this may have caused.
              </Typography>
            </Box>
          </MAlert>
          <Button
            component={Link}
            to='/auth/forgetpassword'
            sx={{ mt: 3, mb: 2 }}
            variant='contained'
            size='small'
            style={{
              textDecoration: 'none',
              color: theme.palette.primary.contrastText,
            }}
          >
            forget password
          </Button>
        </Paper>
      </Container>
    </React.Fragment>
  )
}
