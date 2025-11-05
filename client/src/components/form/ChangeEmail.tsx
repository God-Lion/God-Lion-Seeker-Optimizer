import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  Box,
  Grid,
  IconButton,
  TextField,
  InputAdornment,
  Backdrop,
  CircularProgress,
  Button,
  Stack,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { IUserReponse } from 'src/types'
import { FormLayout } from 'src/components/form'
import { updateEmail } from 'src/services/app/mutation'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from 'src/store'
import { AxiosError } from 'axios'
import { IError } from 'src/types'

export default function ChangeEmail({ user }: { user: IUserReponse }) {
  const { refreshAuth } = useAuth()
  const [loading, setLoading] = React.useState<boolean>(false)
  const [showPassword, setShowPassword] = React.useState<boolean>(false)
  const handleShowPassword = () => setShowPassword(!showPassword)
  type ChangeEmail = {
    email: string
    password: string
  }
  const controlForm = useForm<ChangeEmail>({
    defaultValues: {
      email: user.email,
      password: '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: ChangeEmail) => {
      let body = { password: data.password } as {
        email?: string
        password: string
      }
      const hasChangedEmail =
        user.firstName.toLowerCase() !== data.email?.toLowerCase()
      const hasChangedEmailCase = !hasChangedEmail && user.email !== data.email

      if (hasChangedEmail) body = { ...body, email: data.email }
      if (hasChangedEmailCase)
        controlForm.setError(
          'email',
          {
            type: 'exist',
            message: 'The submitted email matches your current email',
          },
          { shouldFocus: true },
        )
      else controlForm.clearErrors('email')

      return await updateEmail(body)
    },
    onMutate: (variables) => {
      console.log('onMutate variables ', variables)
      setLoading(true)
    },
    onError: (error: AxiosError<IError>) => {
      // console.log('onError ', { error, variables, context })
      controlForm.setError(
        'email',
        {
          type: 'exist',
          message: error.response?.data?.message,
        },
        { shouldFocus: true },
      )
    },
    onSuccess: async (data, variables, context) => {
      // Refresh auth to get updated user data
      await refreshAuth()
      console.log('onSuccess ', { data, variables, context })
    },
    onSettled: () => {
      console.log('onSettled ')
      setLoading(false)
    },
  })
  return (
    <React.Fragment>
      <Backdrop
        sx={{ color: '#FFFFFF', zIndex: (theme) => theme.zIndex.drawer + 10 }}
        open={loading}
      >
        <CircularProgress color='inherit' />
      </Backdrop>
      <FormLayout
        title='Change phone number'
        description='Update your publicly displayed username'
        warning={''}
      >
        <Box
          component='form'
          encType='multipart/form-data'
          onSubmit={controlForm.handleSubmit((data: ChangeEmail) => {
            return mutation.mutate(data)
          })}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={12}>
              <Controller
                name='email'
                control={controlForm.control}
                rules={{
                  required: {
                    value: true,
                    message: 'renseigner ce champ',
                  },
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: "L'adresse email n'est pas valide",
                  },
                  onBlur: (e) => {
                    const email = e.target.value
                    const hasChangedEmail =
                      user.firstName.toLowerCase() !== email?.toLowerCase()
                    const hasChangedEmailCase =
                      !hasChangedEmail && user.email !== email
                    if (!email)
                      controlForm.setError(
                        'email',
                        {
                          type: 'exist',
                          message: 'Please provide a new email',
                        },
                        { shouldFocus: true },
                      )
                    else controlForm.clearErrors('email')
                    if (!hasChangedEmail && !hasChangedEmailCase)
                      controlForm.setError(
                        'email',
                        {
                          type: 'exist',
                          message:
                            'The submitted email matches your current email',
                        },
                        { shouldFocus: true },
                      )
                    else controlForm.clearErrors('email')
                  },
                }}
                render={({ field, formState }) => (
                  <TextField
                    {...field}
                    required
                    fullWidth
                    // disabled={disabled}
                    label='Email'
                    // InputProps={{
                    //   inputProps: {
                    //     readOnly: true,
                    //   },
                    // }}
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

            <Grid item xs={12} sx={{ mt: '30px' }}>
              <Stack direction='row' spacing={2} justifyContent='start'>
                <Button type='submit' variant='contained' color='primary'>
                  Save changes
                </Button>
                {/* <Button type='reset' variant='outlined' color='error'>
                Annuler
              </Button> */}
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </FormLayout>
    </React.Fragment>
  )
}
