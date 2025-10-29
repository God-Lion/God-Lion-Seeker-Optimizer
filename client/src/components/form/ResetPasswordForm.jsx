import React from 'react'
import {
  Box,
  Button,
  Container,
  DialogActions,
  Grid,
  InputAdornment,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import 'react-phone-input-2/lib/style.css'
import { useForm, Controller } from 'react-hook-form'
import { resetPassword } from '../../services/app/index'

export default function ResetPasswordForm({
  handleClose,
  data,
  handleClickStatus,
  setIsUpdated,
}) {
  const controlForm = useForm({
    defaultValues: {
      username: '',
      newPassword: 'Admin#unirx2',
    },
  })
  const [showPassword, setShowPassword] = React.useState(false)
  const handleShowPassword = () => setShowPassword(!showPassword)

  React.useEffect(() => {
    if (data) controlForm.setValue('username', data?.username)
  }, [controlForm, data])

  const onSubmit = async (data) => {
    if (data?.username) {
      const response = await resetPassword(data)
      if (response?.status === 200) {
        handleClickStatus({
          type: 'success',
          state: 'modify',
          msg: 'Le mot de passe a été réinitialisé',
        })
        handleClose()
      }
      if (response?.status >= 400)
        handleClickStatus({
          type: 'error',
          state: 'modify',
          msg: 'La modification du mot de passe a échoué',
        })
      if (response?.response?.status >= 400)
        handleClickStatus({
          type: 'error',
          state: 'modify',
          msg: 'La modification du mot de passe a échoué',
        })
    }
    handleClose()
  }

  return (
    <Container maxWidth='sm' style={{}}>
      <Box
        component='form'
        onSubmit={controlForm.handleSubmit(onSubmit)}
        sx={{ mt: 3 }}
      >
        <Typography sx={{ mb: 3 }}>{data?.email_user}</Typography>
        <Grid container spacing={2} item xs={12}>
          <Grid item xs={12}>
            <Controller
              name='newPassword'
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
              render={({ field }) => (
                <TextField
                  {...field}
                  required
                  type={showPassword ? 'text' : 'password'}
                  label='Nouveau mot de passe'
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
                          {showPassword ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  error={
                    controlForm.formState?.errors?.newPassword !== undefined
                  }
                  helperText={
                    controlForm.formState?.errors?.newPassword?.message
                  }
                />
              )}
            />
          </Grid>
        </Grid>
        <DialogActions>
          <Grid container justifyContent='flex-end' sx={{ mt: '20px' }}>
            <Stack direction='row' justifyContent='space-evenly'>
              <Button
                onClick={() => {
                  controlForm.reset()
                  handleClose()
                }}
                variant='contained'
                color='error'
                position='left'
                sx={{ mr: '20px' }}
              >
                Annuler
              </Button>
              <Button type='submit' variant='contained' position='right'>
                Changer le mot de passe
              </Button>
            </Stack>
          </Grid>
        </DialogActions>
      </Box>
    </Container>
  )
}
