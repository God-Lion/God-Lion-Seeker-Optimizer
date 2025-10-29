import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  Box,
  Grid,
  TextField,
  Button,
  Stack,
  Backdrop,
  CircularProgress,
} from '@mui/material'
import { IUserReponse } from 'src/lib/types'
import FormLayout from './FormLayout'
import { useMutation } from '@tanstack/react-query'
import { updateNames } from 'src/services/app/mutation'
import { IUpdateNames } from 'src/lib/types'
import { useAuth } from 'src/store'

export default function ChangeAccount({ user }: { user: IUserReponse }) {
  const { refreshAuth } = useAuth()
  const [loading, setLoading] = React.useState<boolean>(false)

  const controlForm = useForm<IUpdateNames>({
    defaultValues: {
      lastname: user.lastName,
      firstname: user.firstName,
    },
  })
  const mutation = useMutation({
    mutationFn: async (data: IUpdateNames) => {
      let body = {} as {
        lastname?: string
        firstname?: string
      }
      const hasChangedFirstname =
        user.firstName?.toLowerCase() !== data.firstname?.toLowerCase()
      const hasChangedFirstnameCase =
        !hasChangedFirstname && user.firstName !== data.firstname

      if (hasChangedFirstname) body = { ...body, firstname: data.firstname }
      if (hasChangedFirstnameCase)
        controlForm.setError(
          'firstname',
          {
            type: 'exist',
            message: 'The submitted firstname matches your current firstname',
          },
          { shouldFocus: true },
        )
      else controlForm.clearErrors('firstname')

      const hasChangedLastname =
        user.lastName?.toLowerCase() !== data.lastname?.toLowerCase()
      const hasChangedLastnameCase =
        !hasChangedLastname && user.lastName !== data.lastname

      if (hasChangedLastname) body = { ...body, lastname: data.lastname }
      if (hasChangedLastnameCase)
        controlForm.setError(
          'lastname',
          {
            type: 'exist',
            message: 'The submitted lastname matches your current lastname',
          },
          { shouldFocus: true },
        )
      else controlForm.clearErrors('lastname')
      console.log(body)

      return await updateNames(body)
    },
    onMutate: (variables) => {
      console.log('onMutate variables ', variables)
      setLoading(true)
    },
    onError: (error, variables, context) => {
      console.log('onError ', { error, variables, context })

      // An error happened!
      // console.log(`rolling back optimistic update with id ${context.id}`)
    },
    onSuccess: async (data, variables, context) => {
      // await set()
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
        title='Change info'
        description='Update your publicly displayed username'
        warning={''}
      >
        <Box
          component='form'
          // onSubmit={controlForm.handleSubmit(onSubmit)}
          onSubmit={controlForm.handleSubmit((data: IUpdateNames) => {
            return mutation.mutate(data)
          })}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={12}>
              <Controller
                name='firstname'
                control={controlForm.control}
                rules={{
                  required: {
                    value: true,
                    message: 'renseigner ton prenom',
                  },
                  onBlur: (e) => {
                    const firstname = e.target.value
                    const hasChangedFirstname =
                      user.firstName?.toLowerCase() !== firstname?.toLowerCase()
                    const hasChangedFirstnameCase =
                      !hasChangedFirstname && user.firstName !== firstname

                    if (!firstname)
                      controlForm.setError(
                        'firstname',
                        {
                          type: 'exist',
                          message: 'Please provide a new firstname',
                        },
                        { shouldFocus: true },
                      )
                    else controlForm.clearErrors('firstname')
                    if (!hasChangedFirstname && !hasChangedFirstnameCase)
                      controlForm.setError(
                        'firstname',
                        {
                          type: 'exist',
                          message:
                            'The submitted firstname matches your current firstname',
                        },
                        { shouldFocus: true },
                      )
                    else controlForm.clearErrors('firstname')
                  },
                }}
                render={({ field, formState }) => (
                  <TextField
                    {...field}
                    required
                    fullWidth
                    type='text'
                    label='Prénom'
                    // disabled={disabled}
                    error={formState?.errors?.firstname !== undefined}
                    helperText={formState?.errors?.firstname?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={12}>
              <Controller
                name='lastname'
                control={controlForm.control}
                rules={{
                  required: {
                    value: true,
                    message: 'renseigner ton nom',
                  },
                  onBlur: (e) => {
                    const lastname = e.target.value
                    const hasChangedLastname =
                      user.lastName?.toLowerCase() !== lastname?.toLowerCase()
                    const hasChangedLastnameCase =
                      !hasChangedLastname && user.lastName !== lastname
                    if (!lastname)
                      controlForm.setError(
                        'firstname',
                        {
                          type: 'exist',
                          message: 'Please provide a new firstname',
                        },
                        { shouldFocus: true },
                      )
                    else controlForm.clearErrors('lastname')
                    if (!hasChangedLastname && !hasChangedLastnameCase)
                      controlForm.setError(
                        'lastname',
                        {
                          type: 'exist',
                          message:
                            'The submitted lastname matches your current lastname',
                        },
                        { shouldFocus: true },
                      )
                    else controlForm.clearErrors('lastname')
                  },
                }}
                render={({ field, formState }) => (
                  <TextField
                    {...field}
                    required
                    fullWidth
                    // disabled={disabled}
                    type='text'
                    label='Nom'
                    error={formState?.errors?.lastname !== undefined}
                    helperText={formState?.errors?.lastname?.message}
                  />
                )}
              />
            </Grid>
            {/* <Grid item xs={12} sm={12}>
            <Controller
              name='sexe'
              control={controlForm.control}
              rules={{
                required: {
                  value: true,
                  message: 'renseigner ce champ',
                },
              }}
              render={({ field, formState }) => (
                <FormControl
                  fullWidth
                  // disabled={disabled}
                  error={formState?.errors?.sexe !== undefined}
                >
                  <InputLabel required>Sexe</InputLabel>
                  <Select label='Sexe' {...field}>
                    {[
                      { key: 'M', label: 'Masculin' },
                      { key: 'F', label: 'Feminin' },
                    ]?.map((value, index) => (
                      <MenuItem key={index} value={value.key}>
                        {value.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {formState?.errors?.sexe?.message}
                  </FormHelperText>
                </FormControl>
              )}
            />
          </Grid> */}
            {/* <Grid item xs={12} sm={12}>
            <Controller
              name='address'
              control={controlForm.control}
              rules={{
                required: {
                  value: true,
                  message: 'renseigner ce champs',
                },
              }}
              render={({ field, formState }) => (
                <TextField
                  {...field}
                  required
                  fullWidth
                  // disabled={disabled}
                  type='text'
                  label='Addresse'
                  error={formState?.errors?.address !== undefined}
                  helperText={formState?.errors?.address?.message}
                />
              )}
            />
          </Grid> */}

            <Grid item xs={12} sx={{ mt: '30px' }}>
              <Stack direction='row' spacing={2} justifyContent='start'>
                <Button type='submit' variant='contained' color='primary'>
                  Save changes
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </FormLayout>
    </React.Fragment>
  )
}
