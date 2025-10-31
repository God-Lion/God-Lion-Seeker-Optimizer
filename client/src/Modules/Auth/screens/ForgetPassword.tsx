import { useState, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  CssBaseline,
  Container,
  TextField,
  Typography,
  Snackbar,
  Link as HLink,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { useForm, Controller } from 'react-hook-form'
import { Copyright } from 'src/components'
import MAlert from 'src/components/Alert'
import AdaptiveLogo from 'src/components/AdaptiveLogo'
import themeConfig from 'src/configs/themeConfig'
import { useForgotPassword, ForgotPasswordRequest } from '../index'

// Constants
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Invalid email address',
} as const

const DEFAULT_FORM_VALUES = {
  email: '',
} as const

const SUPPORT_EMAIL = 'support@example.com'

export default function ForgetPassword() {
  const [open, setOpen] = useState<boolean>(false)
  const [alertType, setAlertType] = useState<'error' | 'success'>('success')
  const [errorMessage, setErrorMessage] = useState<string>('')
  
  const handleCloseAlert = useCallback(() => setOpen(false), [])
  
  const handleForgotPasswordSuccess = useCallback(() => {
    setAlertType('success')
    setOpen(true)
    controlForm.reset()
  }, [])
  
  const handleForgotPasswordError = useCallback((error: any) => {
    setAlertType('error')
    setErrorMessage(error.response?.data?.detail || error.message || 'Failed to send reset email')
    setOpen(true)
  }, [])
  
  const forgotPasswordMutation = useForgotPassword({
    onSuccess: handleForgotPasswordSuccess,
    onError: handleForgotPasswordError,
  })
  
  const controlForm = useForm<ForgotPasswordRequest>({
    defaultValues: DEFAULT_FORM_VALUES,
  })

  const onSubmit = useCallback((data: ForgotPasswordRequest) => {
    forgotPasswordMutation.mutate({ data })
  }, [forgotPasswordMutation])

  return (
    <>
      <Helmet>
        <title>Forgot Password - {themeConfig.templateName}</title>
        <meta
          name='description'
          content={`Reset your password on ${themeConfig.templateName}`}
        />
        <meta
          name='keywords'
          content={`forgot password, reset password, ${themeConfig.templateName}`}
        />
      </Helmet>
      <Container
        component='main'
        maxWidth='sm'
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100dvh',
          justifyContent: 'center',
        }}
      >
        <Backdrop
          sx={{ color: '#FFFFFF', zIndex: (theme) => theme.zIndex.drawer + 10 }}
          open={forgotPasswordMutation.isPending}
        >
          <CircularProgress color='inherit' />
        </Backdrop>
        <Snackbar
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          open={open}
          autoHideDuration={6000}
          onClose={handleCloseAlert}
        >
          <MAlert
            onClose={handleCloseAlert}
            severity={alertType}
            sx={{ width: '100%' }}
          >
            {alertType === 'success' && (
              <Box>
                <Typography
                  component='body'
                  pt={1}
                  bgcolor='transparent'
                  color='#FFF'
                >
                  Password Reset Email Sent!
                </Typography>
                <Typography
                  component='body'
                  pt={1}
                  bgcolor='transparent'
                  color='#FFF'
                >
                  We've sent an email to your registered email address with
                  instructions on how to reset your password. Please check your
                  inbox and follow the steps provided.
                </Typography>
                <Typography
                  component='body'
                  pt={1}
                  bgcolor='transparent'
                  color='#FFF'
                >
                  If you don't see the email in your inbox, please check your spam
                  or junk folder. It may take a few minutes for the email to arrive.
                </Typography>
                <Typography
                  component='body'
                  pt={1}
                  bgcolor='transparent'
                  color='#FFF'
                >
                  If you continue to experience issues, please contact our support
                  team at{' '}
                  <HLink component={Link} to={`mailto:${SUPPORT_EMAIL}`}>
                    {SUPPORT_EMAIL}
                  </HLink>
                  .
                </Typography>
                <Typography
                  component='body'
                  pt={1}
                  bgcolor='transparent'
                  color='#FFF'
                  noWrap
                >
                  Thank you for using our platform!
                </Typography>
              </Box>
            )}
            {alertType === 'error' && (
              <Box>
                <Typography
                  component='body'
                  pt={1}
                  bgcolor='transparent'
                  color='#FFF'
                >
                  Error Sending Password Reset Email
                </Typography>
                <Typography
                  variant='body1'
                  component='body'
                  bgcolor='transparent'
                  pt={1}
                  color='#FFF'
                >
                  {errorMessage}
                </Typography>
                <Typography
                  component='body'
                  pt={1}
                  bgcolor='transparent'
                  color='#FFF'
                >
                  We encountered an error while attempting to send the password
                  reset email to your registered email address.
                </Typography>
                <Typography
                  component='body'
                  pt={1}
                  bgcolor='transparent'
                  color='#FFF'
                >
                  Please ensure that the email address provided is correct and try
                  again. If the problem persists, please contact our support team
                  at{' '}
                  <HLink component={Link} to={`mailto:${SUPPORT_EMAIL}`}>
                    {SUPPORT_EMAIL}
                  </HLink>
                  .
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
            )}
          </MAlert>
        </Snackbar>
        <CssBaseline />
        <Box
          sx={{
            my: 8,
            mx: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            alignContent: 'center',
          }}
        >
          <AdaptiveLogo width={270} height={270} sx={{ mb: 2 }} />
          <Typography component='h1' variant='h5'>
            Forgot Password
          </Typography>
          <Box
            component='form'
            noValidate
            onSubmit={controlForm.handleSubmit(onSubmit)}
            sx={{ mt: 3, width: '100%' }}
          >
            <Grid container spacing={0}>
              <Grid item xs={12} sm={12}>
                <Controller
                  name='email'
                  control={controlForm.control}
                  rules={{
                    required: {
                      value: true,
                      message: VALIDATION_MESSAGES.EMAIL_REQUIRED,
                    },
                    pattern: {
                      value: EMAIL_PATTERN,
                      message: VALIDATION_MESSAGES.EMAIL_INVALID,
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      required
                      label='Email Address'
                      fullWidth
                      error={controlForm.formState?.errors?.email !== undefined}
                      helperText={controlForm.formState?.errors?.email?.message}
                    />
                  )}
                />
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Link to='/auth/signin'>
                    <Button
                      type='reset'
                      fullWidth
                      variant='outlined'
                      color='error'
                      sx={{ mt: 3, mb: 2 }}
                    >
                      Cancel
                    </Button>
                  </Link>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    type='submit'
                    variant='contained'
                    sx={{ mt: 3, mb: 2 }}
                    disabled={forgotPasswordMutation.isPending}
                  >
                    {forgotPasswordMutation.isPending ? 'Sending...' : 'Reset Password'}
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </Box>
        <Box mt='auto'>
          <Copyright />
        </Box>
      </Container>
    </>
  )
}
