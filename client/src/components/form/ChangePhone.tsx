import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Box, Grid, IconButton, TextField, InputAdornment } from '@mui/material'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { IUserReponse } from 'src/types'
import { FormLayout } from 'src/components/form'

export default function ChangePhone({ user }: { user: IUserReponse }) {
  const [showPassword, setShowPassword] = React.useState<boolean>(false)
  const handleShowPassword = () => setShowPassword(!showPassword)
  const controlForm = useForm({
    defaultValues: {
      phone: user.phone,
      password: '',
    },
  })
  const onSubmit = () => {}

  return (
    <FormLayout
      title='Change phone number'
      description='Update your publicly displayed username'
      warning={''}
    >
      <Box
        component='form'
        encType='multipart/form-data'
        onSubmit={controlForm.handleSubmit(onSubmit)}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12}>
            <Controller
              name='phone'
              control={controlForm.control}
              render={({ field }) => (
                <PhoneInput
                  {...field}
                  country={'ht'}
                  placeholder='Téléphone'
                  inputProps={{
                    name: 'phone',
                    required: true,
                    autoFocus: true,
                  }}
                  inputStyle={{
                    background: 'transparent',
                    fontFamily: `"Roboto", "Helvetica", "Arial", sans-serif`,
                    fontWeight: 400,
                    fontSize: '1rem',
                    lineHeight: '1.4375em',
                    letterSpacing: '0.00938em',
                    height: '1.4375em',
                    padding: '22.5px 14px',
                    width: '100%',
                  }}
                  // disabled={disabled}
                  // defaultErrorMessage={formState?.errors?.phone?.message}
                  // error={formState?.errors?.phone !== undefined}
                  // helperText={formState?.errors?.phone?.message}
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
                          {showPassword ? <Visibility /> : <VisibilityOff />}
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

          {/* <Grid item xs={12} sx={{ mt: '30px' }}>
            <Stack direction='row' spacing={2} justifyContent='start'>
              <Button type='submit' variant='contained' color='primary'>
                Save changes
              </Button>
              <Button type='reset' variant='outlined' color='error'>
                Annuler
              </Button>
            </Stack>
          </Grid> */}
        </Grid>
      </Box>
    </FormLayout>
  )
}
