import { useState, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  CssBaseline,
  Container,
  Link as HLink,
  InputAdornment,
  IconButton,
  Snackbar,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { useForm, Controller } from 'react-hook-form'
import Copyright from 'src/components/Copyright'
import MAlert from 'src/components/Alert'
import AdaptiveLogo from 'src/components/AdaptiveLogo'
import themeConfig from 'src/configs/themeConfig'
import { IStatus, Roles } from 'src/utils/types'
import { IAuth } from 'src/types'
import { useLogin, LoginRequest } from '../index'
import { useAuth } from 'src/store'

// Constants
const ADMIN_ROLES = [
  String(Roles.ADMIN),
  String(Roles.SUPERADMINEMPLOYEE),
  String(Roles.SUPERADMIN),
  'ADMIN',
  'SUPERADMINEMPLOYEE',
  'SUPERADMIN',
  'ADMINISTRATOR',
] as const

const DEFAULT_FORM_VALUES: LoginRequest = {
  email: 'user@example.com',
  password: 'password123',
  remember_me: false,
}

const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'Email is required',
  PASSWORD_REQUIRED: 'Password is required',
} as const

// Utility functions
const normalizeRole = (role: string | number): string => {
  return typeof role === 'string' ? role.toUpperCase() : String(role)
}

const isUserRole = (role: string): boolean => {
  return role === String(Roles.USER) || role === 'USER'
}

const isAdminRole = (role: string): boolean => {
  return ADMIN_ROLES.includes(role as any)
}

const getNavigationPath = (role: string): string => {
  if (isUserRole(role)) return '/'
  if (isAdminRole(role)) return '/admin/dashboard'
  return '/dashboard'
}

export default function SignIn() {
  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { setUser } = useAuth()
  
  const handleLoginSuccess = useCallback(async (response: any) => {
    const { user, token, refresh_token } = response.data
    const normalizedRole = normalizeRole(user.role || '')
    
    // Update Zustand store with auth data
    const authData: IAuth = {
      user,
      token,
      refreshToken: refresh_token,
    }
    
    // Update the store with user data
    setUser(authData)
    
    // Show success message
    setStatus({
      open: true,
      type: 'success',
      state: 'success',
      msg: 'Login successful!',
    })
    
    // Small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Navigate based on role
    const navigationPath = getNavigationPath(normalizedRole)
    navigate(navigationPath, { replace: true })
  }, [navigate, setUser])
  
  const handleLoginError = useCallback((error: any) => {
    setStatus({
      open: true,
      type: 'error',
      state: 'error',
      msg: error.response?.data?.detail || 'Login failed. Please try again.',
    })
  }, [])
  
  const loginMutation = useLogin({
    onSuccess: handleLoginSuccess,
    onError: handleLoginError,
  })
  
  const [status, setStatus] = useState<IStatus>({
    open: location.state?.data?.page === 'close-cashier',
    type: location.state?.data?.type || '',
    state: location.state?.data?.state || '',
    msg: location.state?.data?.msg || '',
  })
  
  const [showPassword, setShowPassword] = useState<boolean>(false)
  
  const handleCloseStatus = useCallback(() => {
    setStatus((prev) => ({ ...prev, open: false }))
  }, [])
  
  const handleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev)
  }, [])
  
  const controlForm = useForm<LoginRequest>({
    defaultValues: DEFAULT_FORM_VALUES,
  })

  const onSubmit = useCallback((data: LoginRequest) => {
    loginMutation.mutate({ data })
  }, [loginMutation])

  return (
    <>
      <Helmet>
        <title>Sign In - {themeConfig.templateName}</title>
        <meta
          name='description'
          content={`Sign in to your account on ${themeConfig.templateName}`}
        />
        <meta
          name='keywords'
          content={`sign in, login, authentication, ${themeConfig.templateName}`}
        />
      </Helmet>
      <Container
        component='main'
        maxWidth='xs'
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100dvh',
          justifyContent: 'center',
        }}
      >
        <Backdrop open={loginMutation.isPending}>
          <CircularProgress color='inherit' />
        </Backdrop>
        <Snackbar
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          open={status.open}
          autoHideDuration={6000}
          onClose={handleCloseStatus}
        >
          <MAlert
            onClose={handleCloseStatus}
            severity={status.type}
            sx={{ width: '100%' }}
          >
            {status.msg}
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
            [theme.breakpoints.up('xl')]: {
              mt: '10%',
            },
            [theme.breakpoints.up('sm')]: {
              mt: '20%',
            },
            [theme.breakpoints.down('sm')]: {
              mt: '30%',
            },
          }}
        >
          <AdaptiveLogo width={270} height={270} />
          <Typography component='h1' variant='h5'>
            Sign in
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
              <Grid item xs={12}>
                <Controller
                  name='email'
                  control={controlForm.control}
                  rules={{
                    required: {
                      value: true,
                      message: VALIDATION_MESSAGES.EMAIL_REQUIRED,
                    },
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  }}
                  render={({ field, formState }) => (
                    <TextField
                      {...field}
                      required
                      type='email'
                      label='Email Address'
                      fullWidth
                      autoComplete='email'
                      error={formState?.errors?.email !== undefined}
                      helperText={formState?.errors?.email?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name='password'
                  control={controlForm.control}
                  rules={{
                    required: {
                      value: true,
                      message: VALIDATION_MESSAGES.PASSWORD_REQUIRED,
                    },
                  }}
                  render={({ field, formState }) => (
                    <TextField
                      {...field}
                      required
                      type={showPassword ? 'text' : 'password'}
                      label='Password'
                      fullWidth
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
                      error={formState?.errors?.password !== undefined}
                      helperText={formState?.errors?.password?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
            <Controller
              name='remember_me'
              control={controlForm.control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      color='primary'
                    />
                  }
                  label='Remember me'
                  labelPlacement='end'
                />
              )}
            />

            <Button
              type='submit'
              fullWidth
              variant='contained'
              sx={{ mt: 3, mb: 2 }}
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>
            <Grid container justifyContent='flex-end'>
              <Grid item>
                <HLink
                  component={Link}
                  to='/auth/forgetpassword'
                  sx={{ textDecoration: 'underline' }}
                >
                  Forgot password?
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
