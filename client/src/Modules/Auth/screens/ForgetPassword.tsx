import { useState, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Container,
  TextField,
  Typography,
  Snackbar,
  Paper,
  Link as MuiLink,
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
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

      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box
          component="header"
          sx={{
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #E0E0E0',
            px: { xs: 2, sm: 3, lg: 4 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: '1280px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AdaptiveLogo width={32} height={32} />
              <Typography
                variant="h6"
                sx={{
                  color: '#333333',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                }}
              >
                JobTrackr
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 2, sm: 3, lg: 4 },
            py: 6,
          }}
        >
          <Container maxWidth="sm">
            <Box sx={{ width: '100%', maxWidth: 448 }}>
              {/* Content Card */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: '1px solid #E0E0E0',
                  // bgcolor: 'white',
                  p: 4,
                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Page Heading */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'center' }}>
                    <Typography
                      component="h1"
                      sx={{
                        color: '#333333',
                        fontSize: '1.875rem',
                        fontWeight: 900,
                        letterSpacing: '-0.025em',
                      }}
                    >
                      Forgot Your Password?
                    </Typography>
                    <Typography
                      sx={{
                        color: '#6C757D',
                        fontSize: '1rem',
                      }}
                    >
                      No problem. Enter your email address below and we'll send you a link to reset it.
                    </Typography>
                  </Box>

                  {/* Form */}
                  <Box
                    component="form"
                    onSubmit={controlForm.handleSubmit(onSubmit)}
                    sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
                  >
                    {/* Email Field */}
                    <Box>
                      <Typography
                        component="label"
                        htmlFor="email"
                        sx={{
                          display: 'block',
                          color: '#333333',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          mb: 1,
                        }}
                      >
                        Email Address
                      </Typography>
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
                            id="email"
                            type="email"
                            placeholder="e.g., your.email@example.com"
                            fullWidth
                            error={controlForm.formState?.errors?.email !== undefined}
                            helperText={controlForm.formState?.errors?.email?.message}
                            // sx={{
                            //   '& .MuiOutlinedInput-root': {
                            //     bgcolor: 'white',
                            //     '& fieldset': {
                            //       borderColor: '#E0E0E0',
                            //     },
                            //     '&:hover fieldset': {
                            //       borderColor: '#D4AF37',
                            //     },
                            //     '&.Mui-focused fieldset': {
                            //       borderColor: '#D4AF37',
                            //       borderWidth: '2px',
                            //     },
                            //   },
                            //   '& .MuiOutlinedInput-input': {
                            //     color: '#333333',
                            //     '&::placeholder': {
                            //       color: 'rgba(108, 117, 125, 0.7)',
                            //       opacity: 1,
                            //     },
                            //   },
                            // }}
                          />
                        )}
                      />
                    </Box>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={forgotPasswordMutation.isPending}
                      sx={{
                        bgcolor: '#D4AF37',
                        color: 'white',
                        py: 1.5,
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: 1.5,
                        boxShadow: 'none',
                        '&:hover': {
                          bgcolor: '#c8a42e',
                          boxShadow: 'none',
                        },
                        '&:focus': {
                          outline: '2px solid #D4AF37',
                          outlineOffset: '2px',
                        },
                        '&.Mui-disabled': {
                          // bgcolor: '#E0E0E0',
                          color: '#6C757D',
                        },
                      }}
                    >
                      {forgotPasswordMutation.isPending ? 'Sending...' : 'Send Recovery Link'}
                    </Button>
                  </Box>
                </Box>
              </Paper>

              {/* Footer Link */}
              <Typography
                sx={{
                  mt: 4,
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  color: '#6C757D',
                }}
              >
                Remember your password?{' '}
                <MuiLink
                  component={Link}
                  to="/auth/signin"
                  sx={{
                    fontWeight: 500,
                    color: '#8B4513',
                    textDecoration: 'underline',
                    '&:hover': {
                      color: '#6a360f',
                    },
                  }}
                >
                  Back to Log In
                </MuiLink>
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#FFFFFF', zIndex: (theme) => theme.zIndex.drawer + 10 }}
        open={forgotPasswordMutation.isPending}
      >
        <CircularProgress color='inherit' />
      </Backdrop>

      {/* Alert Snackbar */}
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
                component='div'
                sx={{ pt: 1, bgcolor: 'transparent', color: '#FFF' }}
              >
                Password Reset Email Sent!
              </Typography>
              <Typography
                component='div'
                sx={{ pt: 1, bgcolor: 'transparent', color: '#FFF' }}
              >
                We've sent an email to your registered email address with
                instructions on how to reset your password. Please check your
                inbox and follow the steps provided.
              </Typography>
              <Typography
                component='div'
                sx={{ pt: 1, bgcolor: 'transparent', color: '#FFF' }}
              >
                If you don't see the email in your inbox, please check your spam
                or junk folder. It may take a few minutes for the email to arrive.
              </Typography>
              <Typography
                component='div'
                sx={{ pt: 1, bgcolor: 'transparent', color: '#FFF' }}
              >
                If you continue to experience issues, please contact our support
                team at{' '}
                <MuiLink
                  component={Link}
                  to={`mailto:${SUPPORT_EMAIL}`}
                  sx={{ color: '#FFF', textDecoration: 'underline' }}
                >
                  {SUPPORT_EMAIL}
                </MuiLink>
                .
              </Typography>
              <Typography
                component='div'
                sx={{ pt: 1, bgcolor: 'transparent', color: '#FFF' }}
              >
                Thank you for using our platform!
              </Typography>
            </Box>
          )}
          {alertType === 'error' && (
            <Box>
              <Typography
                component='div'
                sx={{ pt: 1, bgcolor: 'transparent', color: '#FFF' }}
              >
                Error Sending Password Reset Email
              </Typography>
              <Typography
                component='div'
                sx={{ pt: 1, bgcolor: 'transparent', color: '#FFF' }}
              >
                {errorMessage}
              </Typography>
              <Typography
                component='div'
                sx={{ pt: 1, bgcolor: 'transparent', color: '#FFF' }}
              >
                We encountered an error while attempting to send the password
                reset email to your registered email address.
              </Typography>
              <Typography
                component='div'
                sx={{ pt: 1, bgcolor: 'transparent', color: '#FFF' }}
              >
                Please ensure that the email address provided is correct and try
                again. If the problem persists, please contact our support team
                at{' '}
                <MuiLink
                  component={Link}
                  to={`mailto:${SUPPORT_EMAIL}`}
                  sx={{ color: '#FFF', textDecoration: 'underline' }}
                >
                  {SUPPORT_EMAIL}
                </MuiLink>
                .
              </Typography>
              <Typography
                component='div'
                sx={{ pt: 1, bgcolor: 'transparent', color: '#FFF' }}
              >
                We apologize for any inconvenience this may have caused.
              </Typography>
            </Box>
          )}
        </MAlert>
      </Snackbar>
    </>
  )
}
