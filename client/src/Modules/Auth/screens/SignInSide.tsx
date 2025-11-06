import React from 'react'
import { Helmet } from 'react-helmet-async'
import themeConfig from 'src/configs/themeConfig'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  Avatar,
  Backdrop,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  CssBaseline,
  FormControlLabel,
  Link as HLink,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { useTheme } from '@mui/material/styles'
import { Controller, useForm } from 'react-hook-form'
import Copyright from 'src/components/Copyright'
import { useAuth } from 'src/store'
import MAlert from 'src/components/Alert'
import Session from 'src/services/Session'
import { isObjectEmpty } from 'src/utils'
import { ILogin } from 'src/types'
import { IStatus } from 'src/utils/types'
import { Roles } from 'src/utils/types'

export default function SignInSide() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  const theme = useTheme()
  const { signIn, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [status, setStatus] = React.useState<IStatus>({
    open: location.state?.data?.page === 'close-cashier',
    type: location.state?.data?.type || '',
    state: location.state?.data?.state || '',
    msg: location.state?.data?.msg || '',
  })
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  // const _handleClickStatus = (newStatus: React.SetStateAction<IStatus>) => {
  //   setStatus({ msg: '', state: '', type: '', ...newStatus, open: true })
  // }
  const handleCloseStatus = () => {
    setStatus({ ...status, open: false })
  }
  const controlForm = useForm<ILogin>({
    defaultValues: {
      email: 'borneluszico@gmail.com',
      password: 'Admin#12',
      // email: 'zicobornelus@gmail.com',
      // email: 'bicoz@gmail.com',
      // email: 'stephneloubeau@gmail.com',
      // password: 'Judge#12',
      // email: 'jeanpierre@gmail.com',
      // password: 'participant',
      // email: '',
      // password: '',
      rememberMe: false,
    },
  })

  const [showPassword, setShowPassword] = React.useState<boolean>(false)
  const handleShowPassword = () => setShowPassword(!showPassword)
  const [openBackdrop] = React.useState<boolean>(false)

  return (
    <React.Fragment>
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
      <Grid
        container
        component='main'
        sx={{
          height: '100vh',
        }}
      >
        <Backdrop open={openBackdrop}>
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
        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          sx={{
            backgroundImage:
              'url(https://source.unsplash.com/random?wallpapers)',
            backgroundRepeat: 'no-repeat',
            backgroundColor: (t) =>
              t.palette.mode === 'light'
                ? t.palette.grey[50]
                : t.palette.grey[900],
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <Grid
          item
          xs={12}
          sm={8}
          md={5}
          component={Paper}
          elevation={6}
          square
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
              <LockOutlinedIcon />
            </Avatar>
            <Typography component='h1' variant='h5'>
              Sign in
            </Typography>
            <Box
              component='form'
              noValidate
              sx={{ mt: 1 }}
              onSubmit={controlForm.handleSubmit(async (data: ILogin) => {
                await signIn(data)
                const session = new Session()
                const userSession = session.read('user')
                const roleId = user?.role ?? userSession?.role
                if (
                  !isObjectEmpty(userSession) &&
                  // !isObjectEmpty(res?.data) &&
                  roleId === Roles.USER
                )
                  return navigate('/')
                if (!isObjectEmpty(userSession) && roleId === Roles.ADMIN)
                  return navigate('/admin/')
              })}
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Controller
                    name='email'
                    control={controlForm.control}
                    rules={{
                      required: {
                        value: true,
                        message: `Le champ ne peut pas être vide.`,
                      },
                    }}
                    render={({ field, formState }) => (
                      <TextField
                        {...field}
                        required
                        type='email'
                        label='Address couriel'
                        fullWidth
                        autoComplete='email'
                        error={formState?.errors.root?.type !== undefined}
                        helperText={formState?.errors?.root?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name='password'
                    control={controlForm.control}
                    rules={{ required: true }}
                    render={({ field, formState }) => (
                      <TextField
                        {...field}
                        required
                        type={showPassword ? 'text' : 'password'}
                        label='Mot de passe'
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
                        error={formState?.errors?.root?.type !== undefined}
                        helperText={formState?.errors?.root?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
              {/* <TextField
              margin='normal'
              required
              fullWidth
              id='email'
              label='Email Address'
              name='email'
              autoComplete='email'
              autoFocus
            />
            <TextField
              margin='normal'
              required
              fullWidth
              name='password'
              label='Password'
              type='password'
              id='password'
              autoComplete='current-password'
            /> */}
              <Controller
                name='rememberMe'
                control={controlForm.control}
                render={({ field }) => (
                  <FormControlLabel
                    required
                    control={<Checkbox {...field} color='primary' />}
                    label='Remember me'
                    labelPlacement='end'
                    // disabled={disabled}
                    onClick={() => field.onChange(!field.value)}
                    checked={field.value}
                  />
                )}
              />
              <Button
                type='submit'
                fullWidth
                variant='contained'
                sx={{ mt: 3, mb: 2 }}
              >
                Sign In
              </Button>
              <Grid container>
                <Grid item xs>
                  <HLink component={Link} to='/auth/forgetpassword'>
                    Forgot password?
                  </HLink>
                </Grid>
                <Grid item>
                  <HLink component={Link} to='/auth/signup'>
                    Don't have an account? Sign Up"
                  </HLink>
                </Grid>
              </Grid>
              <Copyright sx={{ mt: 5 }} />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </React.Fragment>
  )
}
