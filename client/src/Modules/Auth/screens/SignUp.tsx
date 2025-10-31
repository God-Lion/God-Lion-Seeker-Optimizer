import { useState, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import {
  Backdrop,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  CssBaseline,
  Container,
  FormControl,
  FormControlLabel,
  Link as HLink,
  FormHelperText,
  InputAdornment,
  IconButton,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import Copyright from 'src/components/Copyright'
import MAlert from 'src/components/Alert'
import AdaptiveLogo from 'src/components/AdaptiveLogo'
import themeConfig from 'src/configs/themeConfig'
import { useRegister, RegisterRequest } from '../index'

// Constants
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/

const VALIDATION_MESSAGES = {
  FIRST_NAME_REQUIRED: 'First name is required',
  LAST_NAME_REQUIRED: 'Last name is required',
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Invalid email address',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
  PASSWORD_PATTERN: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  PASSWORD_MISMATCH: 'Passwords do not match',
  TERMS_REQUIRED: 'You must accept the terms and conditions',
} as const

const DEFAULT_FORM_VALUES = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  confirmPassword: '',
  isTermsSign: false,
} as const

const SUPPORT_EMAIL = 'support@example.com'

interface SignUpFormData {
  first_name: string
  last_name: string
  email: string
  password: string
  confirmPassword: string
  isTermsSign: boolean
}

export default function SignUp() {
  const [open, setOpen] = useState<boolean>(false)
  const [alertType, setAlertType] = useState<'error' | 'success'>('success')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  
  const handleCloseAlert = useCallback(() => setOpen(false), [])
  const handleShowPassword = useCallback(() => setShowPassword((prev) => !prev), [])
  
  const handleRegisterSuccess = useCallback(() => {
    setAlertType('success')
    setOpen(true)
    controlForm.reset()
  }, [])
  
  const handleRegisterError = useCallback((error: any) => {
    setAlertType('error')
    setErrorMessage(error.response?.data?.detail || error.message || 'Registration failed')
    setOpen(true)
  }, [])
  
  const registerMutation = useRegister({
    onSuccess: handleRegisterSuccess,
    onError: handleRegisterError,
  })
  
  const controlForm = useForm<SignUpFormData>({
    defaultValues: DEFAULT_FORM_VALUES,
  })

  const onSubmit = useCallback((data: SignUpFormData) => {
    const registerData: RegisterRequest = {
      email: data.email,
      password: data.password,
      first_name: data.first_name,
      last_name: data.last_name,
    }
    registerMutation.mutate({ data: registerData })
  }, [registerMutation])

  return (
    <>
      <Helmet>
        <title>Sign Up - {themeConfig.templateName}</title>
        <meta
          name='description'
          content={`Create a new account on ${themeConfig.templateName}`}
        />
        <meta
          name='keywords'
          content={`sign up, registration, create account, ${themeConfig.templateName}`}
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
          open={registerMutation.isPending}
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
                  Email Verification Sent!
                </Typography>
                <Typography
                  component='body'
                  pt={1}
                  bgcolor='transparent'
                  color='#FFF'
                >
                  We've sent an email to your registered email address with a link
                  to verify your account. Please check your inbox and click on the
                  verification link to complete the registration process.
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
                  Thank you for joining us!
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
                  Error Sending Email Verification
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
                  We encountered an issue while attempting to send the email
                  verification to your registered email address.
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
            alignItems: 'center',
          }}
        >
          <AdaptiveLogo width={270} height={270} sx={{ mb: 2 }} />
          <Typography component='h1' variant='h5'>
            Sign Up
          </Typography>
          <Box
            component='form'
            noValidate
            onSubmit={controlForm.handleSubmit(onSubmit)}
            sx={{
              mt: 3,
              width: '100%',
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name='last_name'
                  control={controlForm.control}
                  rules={{
                    required: {
                      value: true,
                      message: VALIDATION_MESSAGES.LAST_NAME_REQUIRED,
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      required
                      type='text'
                      label='Last Name'
                      fullWidth
                      error={
                        controlForm.formState?.errors?.last_name !== undefined
                      }
                      helperText={
                        controlForm.formState?.errors?.last_name?.message
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name='first_name'
                  control={controlForm.control}
                  rules={{
                    required: {
                      value: true,
                      message: VALIDATION_MESSAGES.FIRST_NAME_REQUIRED,
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      required
                      type='text'
                      label='First Name'
                      fullWidth
                      error={
                        controlForm.formState?.errors?.first_name !== undefined
                      }
                      helperText={
                        controlForm.formState?.errors?.first_name?.message
                      }
                    />
                  )}
                />
              </Grid>
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
              <Grid item xs={12} sm={12}>
                <Controller
                  name='password'
                  control={controlForm.control}
                  rules={{
                    required: {
                      value: true,
                      message: VALIDATION_MESSAGES.PASSWORD_REQUIRED,
                    },
                    minLength: {
                      value: 8,
                      message: VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH,
                    },
                    pattern: {
                      value: PASSWORD_PATTERN,
                      message: VALIDATION_MESSAGES.PASSWORD_PATTERN,
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      required
                      fullWidth
                      type={showPassword ? 'text' : 'password'}
                      label='Password'
                      autoComplete='password'
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              aria-label='toggle password visibility'
                              onClick={handleShowPassword}
                              edge='end'
                            >
                              {showPassword ? (
                                <Visibility />
                              ) : (
                                <VisibilityOff />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      error={
                        controlForm.formState?.errors?.password !== undefined
                      }
                      helperText={
                        controlForm.formState?.errors?.password?.message
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <Controller
                  name='confirmPassword'
                  control={controlForm.control}
                  rules={{
                    required: true,
                    validate: (value) => {
                      const password = controlForm.getValues('password')
                      return value === password || VALIDATION_MESSAGES.PASSWORD_MISMATCH
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      required
                      type={showPassword ? 'text' : 'password'}
                      label='Confirm Password'
                      fullWidth
                      autoComplete='password'
                      error={
                        controlForm.formState?.errors?.confirmPassword !==
                        undefined
                      }
                      helperText={
                        controlForm.formState?.errors?.confirmPassword?.message
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <Controller
                  name='isTermsSign'
                  control={controlForm.control}
                  rules={{
                    required: {
                      value: true,
                      message: VALIDATION_MESSAGES.TERMS_REQUIRED,
                    },
                  }}
                  render={({ field, formState }) => (
                    <FormControl
                      component='fieldset'
                      error={formState?.errors?.isTermsSign !== undefined}
                      sx={{
                        width: '100%',
                      }}
                    >
                      <Typography variant='body2' sx={{ mb: 1 }}>
                        By registering, you agree to our terms and conditions.
                      </Typography>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            color='primary'
                          />
                        }
                        label='I certify that the above information is true and accurate'
                        labelPlacement='end'
                      />
                      <FormHelperText>
                        {formState?.errors?.isTermsSign?.message}
                      </FormHelperText>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
            <Button
              type='submit'
              fullWidth
              variant='contained'
              sx={{ mt: 3, mb: 2 }}
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Signing up...' : 'Sign Up'}
            </Button>
            <Grid container justifyContent='flex-end'>
              <Grid item>
                <HLink
                  component={Link}
                  to='/auth/signin'
                  sx={{ textDecoration: 'underline' }}
                >
                  Already have an account? Sign in
                </HLink>
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
