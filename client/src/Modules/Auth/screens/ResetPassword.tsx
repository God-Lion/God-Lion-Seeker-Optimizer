import React from 'react'
import { Helmet } from 'react-helmet-async'
import themeConfig from 'src/configs/themeConfig'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Visibility,
  VisibilityOff,
  Copyright,
  LockOutlined,
} from '@mui/icons-material'
import {
  Container,
  Backdrop,
  CircularProgress,
  Snackbar,
  CssBaseline,
  Typography,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Paper,
  Avatar,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import { useTheme } from '@mui/material/styles'
import { Controller, useForm } from 'react-hook-form'
import MAlert from 'src/components/Alert'
import { useResetPassword, ResetPasswordRequest } from '../index'
import { authService } from 'src/services/api/api.service'
import { AxiosError, AxiosResponse } from 'axios'
import { IUserReponseEmailResetPassword } from 'src/types'

interface ResetPasswordFormData {
  token: string
  new_password: string
  confirmPassword: string
}

export default function ResetPassword() {
  const theme = useTheme()
  const navigate = useNavigate()
  const { email } = useParams()
  let [searchParams] = useSearchParams()
  const signature = searchParams.get('signature')

  const [loading, setLoading] = React.useState<boolean>(false)
  const [open, setOpen] = React.useState<boolean>(false)
  const [error, setError] = React.useState<AxiosError>()
  const [errorMessage, setErrorMessage] = React.useState<string>('')
  
  const handleCloseAlert = () => setOpen(false)

  const [userReponseEmailResetPassword, setUserReponseEmailResetPassword] =
    React.useState<IUserReponseEmailResetPassword>()

  const resetPasswordMutation = useResetPassword({
    onSuccess: () => {
      navigate('/auth/signin')
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.detail || error.message || 'Failed to reset password')
      setOpen(true)
    },
  })

  const controlForm = useForm<ResetPasswordFormData>({
    defaultValues: {
      token: '',
      new_password: '',
      confirmPassword: '',
    },
  })

  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response: AxiosResponse<IUserReponseEmailResetPassword> =
          await authService.verifyEmail(email || '', signature ?? '')
        if (response.status === 202) {
          setUserReponseEmailResetPassword(response.data)
          controlForm.setValue('token', response.data.token || '')
        }
      } catch (error) {
        setError(error as AxiosError)
        console.log('error ', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [controlForm, email, signature])

  const [showPassword, setShowPassword] = React.useState<boolean>(false)
  const handleShowPassword = () => setShowPassword(!showPassword)

  const onSubmit = async (data: ResetPasswordFormData) => {
    const resetData: ResetPasswordRequest = {
      token: data.token,
      new_password: data.new_password,
    }
    resetPasswordMutation.mutate({ data: resetData })
  }

  if (userReponseEmailResetPassword?.isSignatureValid === false) {
    return (
      <React.Fragment>
        <Helmet>
          <title>Reset Password - {themeConfig.templateName}</title>
          <meta
            name='description'
            content={`Reset your password on ${themeConfig.templateName}`}
          />
          <meta
            name='keywords'
            content={`reset password, new password, ${themeConfig.templateName}`}
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
                  Please request a new password reset link by visiting the
                  forgot password page and submitting your email address again.
                  Make sure to use the latest link sent to your email inbox.
                </Typography>
                <Typography
                  component='body'
                  pt={1}
                  bgcolor='transparent'
                  color='#FFF'
                >
                  If you continue to experience issues, please contact our
                  support team at{' '}
                  <Link to='mailto:support@example.com'>
                    support@example.com
                  </Link>{' '}
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

  return (
    <React.Fragment>
      <Helmet>
        <title>Reset Password - {themeConfig.templateName}</title>
        <meta
          name='description'
          content={`Reset your password on ${themeConfig.templateName}`}
        />
        <meta
          name='keywords'
          content={`reset password, new password, ${themeConfig.templateName}`}
        />
      </Helmet>
      <Container
        component='main'
        maxWidth='xs'
        sx={{
          // backgroundColor: '#EF5350',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '100%',
          minHeight: '100dvh',
          margin: 0,
          padding: 0,
          [theme.breakpoints.up('lg')]: {
            width: '100%',
            maxWidth: '100%',
            minHeight: '100dvh',
            margin: 0,
            padding: 0,
          },
          [theme.breakpoints.up('md')]: {
            width: '100%',
            maxWidth: '100%',
            minHeight: '100dvh',
            margin: 0,
            padding: 0,
          },
          [theme.breakpoints.up('sm')]: {
            width: '100%',
            maxWidth: '100%',
            minHeight: '100svh',
            margin: 0,
            padding: 0,
          },
          [theme.breakpoints.up('xl')]: {
            width: '100%',
            maxWidth: '100%',
            minHeight: '100svh',
            margin: 0,
            padding: 0,
          },
          [theme.breakpoints.up('xs')]: {
            width: '100%',
            maxWidth: '100%',
            minHeight: '100svh',
            margin: 0,
            padding: 0,
          },
        }}
      >
        <Backdrop open={loading || resetPasswordMutation.isPending}>
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
            severity='error'
            sx={{ width: '100%' }}
          >
            {(
              <Box>
                <Typography
                  component='body'
                  pt={1}
                  bgcolor='transparent'
                  color='#FFF'
                >
                  Error Resetting Password
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
                  We regret to inform you that we encountered an issue while
                  attempting to reset your password. Our team has been notified
                  of the problem and is working to resolve it as quickly as
                  possible.
                </Typography>
                <Typography
                  component='body'
                  pt={1}
                  bgcolor='transparent'
                  color='#FFF'
                >
                  In the meantime, please try resetting your password again
                  later. If the issue persists, please contact our support team
                  at{' '}
                  <Link to='mailto:support@example.com'>
                    support@example.com
                  </Link>{' '}
                  for further assistance.
                </Typography>
                <Typography
                  component='body'
                  pt={1}
                  bgcolor='transparent'
                  color='#FFF'
                  noWrap
                >
                  We apologize for any inconvenience this may have caused and
                  appreciate your patience.
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
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlined />
          </Avatar>
          <Typography component='h1' variant='h5'>
            Password reset
          </Typography>
          <Box
            component='form'
            noValidate
            onSubmit={controlForm.handleSubmit(onSubmit)}
            sx={{ mt: 3 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12}>
                <TextField
                  required
                  fullWidth
                  label='Courriel'
                  value={email || ''}
                  InputProps={{
                    inputProps: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name='new_password'
                  control={controlForm.control}
                  rules={{
                    required: {
                      value: true,
                      message: 'Mot de passe requis',
                    },
                    minLength: {
                      value: 8,
                      message:
                        'Le mot de passe doit contenir au moins 8 caractères',
                    },
                    pattern: {
                      value:
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/,
                      message:
                        'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
                    },
                  }}
                  render={({ field, formState }) => (
                    <TextField
                      {...field}
                      required
                      fullWidth
                      type={showPassword ? 'text' : 'password'}
                      label='Mot de passe'
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
                      error={formState?.errors?.new_password !== undefined}
                      helperText={formState?.errors?.new_password?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name='confirmPassword'
                  control={controlForm.control}
                  rules={{
                    required: true,
                    onBlur: (event) => {
                      if (
                        controlForm.getValues('new_password')?.trim() !==
                        event.target.value
                      )
                        controlForm.setError(
                          'confirmPassword',
                          {
                            type: 'notMatch',
                            message: 'Les mots de passe ne correspondent pas',
                          },
                          { shouldFocus: true },
                        )
                      else controlForm.clearErrors('confirmPassword')
                    },
                  }}
                  render={({ field, formState }) => (
                    <TextField
                      {...field}
                      required
                      type={showPassword ? 'text' : 'password'}
                      label='Confirmer vorte mot de passe'
                      fullWidth
                      autoComplete='password'
                      error={formState?.errors?.confirmPassword !== undefined}
                      helperText={formState?.errors?.confirmPassword?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
            <Button
              type='submit'
              fullWidth
              variant='contained'
              sx={{ mt: 3, mb: 2 }}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset'}
            </Button>
          </Box>
        </Box>
        <Box mt={5}>
          <Copyright />
        </Box>
      </Container>
    </React.Fragment>
  )
}
