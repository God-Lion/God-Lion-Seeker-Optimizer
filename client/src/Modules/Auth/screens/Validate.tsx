import React from 'react'
import { Helmet } from 'react-helmet-async'
import themeConfig from 'src/configs/themeConfig'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Backdrop,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { authService } from 'src/services/api/api.service'
import { QUERY_KEYS } from 'src/services/api'
import { IStatus } from 'src/utils/types'

export default function Validate() {
  const { id, token, location } = useParams()
  const navigate = useNavigate()
  const {
    data: validateUserData,
    isLoading: _isLoadingValidateUser,
    isSuccess: isSuccessValidateUser,
    isError: isErrorValidateUser,
  } = useQuery({
    queryKey: QUERY_KEYS.validateUser(id ?? '', token ?? ''),
    queryFn: () => authService.validateUser(id ?? '', token ?? ''),
    enabled: !!id && !!token,
  })
  const validateUser = validateUserData?.data
  const [loading, _setLoading] = React.useState(false)
  const [status, setStatus] = React.useState<IStatus>({
    open: false,
    type: '',
    state: '',
    msg: '',
  })
  const handleClickStatus = (newState: React.SetStateAction<IStatus>) => {
    setStatus({ type: '', state: '', msg: '', open: true, ...newState })
  }
  //   const handleCloseStatus = () => {
  //     setStatus({ ...status, open: false })
  //   }

  React.useEffect(() => {
    if (isSuccessValidateUser) {
      const { firstname, lastname } = validateUser?.user
      const type = validateUser.type
      console.log({ firstname, lastname, type })
      if (type === 'already validate')
        handleClickStatus({
          open: true,
          type: 'warning',
          state: 'save',
          msg: `${firstname} ${lastname} your account is already validate`,
        })
      if (type === 'validate') {
        handleClickStatus({
          open: true,
          type: 'info',
          state: 'save',
          msg: `${firstname} ${lastname} your account is validate, user your email to connect to your profile`,
        })
      }
      navigate('/validate', {
        replace: true,
        state: {
          from: location,
          data: {
            page: 'validate',
            type: 'success',
            state: 'validate',
            msg: `${firstname} ${lastname} your account is validate, user your email to connect to your profile`,
          },
        },
      })
    }
    if (isErrorValidateUser) {
      handleClickStatus({
        open: true,
        type: 'error',
        state: 'save',
        msg: 'Please register to connect',
      })
    }
    // if (response?.response?.status >= 400) {
    //   handleClickStatus({
    //     type: 'error',
    //     state: 'save',
    //     msg: response?.response?.data.message,
    //   })
    // }
  }, [
    isErrorValidateUser,
    isSuccessValidateUser,
    location,
    navigate,
    validateUser,
  ])
  return (
    <React.Fragment>
      <Helmet>
        <title>Registration Validation - {themeConfig.templateName}</title>
        <meta
          name='description'
          content={`Validate your registration on ${themeConfig.templateName}`}
        />
        <meta
          name='keywords'
          content={`registration validation, account validation, ${themeConfig.templateName}`}
        />
      </Helmet>

      <Container maxWidth='lg' style={{}}>
        <Backdrop
          sx={{ color: '#FFFFFF', zIndex: (theme) => theme.zIndex.drawer + 10 }}
          open={loading}
        >
          <CircularProgress color='inherit' />
        </Backdrop>

        <Paper
          variant='outlined'
          sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}
        >
          <Typography component='h1' variant='h5'>
            MASCAYITI
          </Typography>
          <Typography component='h5' variant='body1'>
            Registration validation
          </Typography>
          <Alert
            // severity={status.type}
            sx={{ width: '100%' }}
          >
            {status.msg}
          </Alert>
          {status?.type !== 'error' && (
            <Button
              fullWidth
              variant='contained'
              sx={{ mt: 3, mb: 2 }}
              onClick={() => {
                navigate(location?.replace(/_/g, '/') || '/auth/signin', {
                  state: {
                    from: location,
                  },
                })
              }}
            >
              Connecter
            </Button>
          )}
        </Paper>
      </Container>
    </React.Fragment>
  )
}
