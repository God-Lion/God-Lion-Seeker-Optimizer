import React from 'react'
import { useForm } from 'react-hook-form'
import {
  Box,
  Button,
  Grid,
  Typography,
  CardContent,
  Input,
  Avatar,
} from '@mui/material'
import { AccountCircle } from '@mui/icons-material'
import { FormLayout } from 'src/components/form'

export default function UpdateAboutYou() {
  const controlForm = useForm({
    defaultValues: {
      user_id: NaN,
      lastname: '',
      firstname: '',
      sexe: '',
      address: '',
    },
  })
  const onSubmit = (data: any) => {}
  return (
    <FormLayout
      title='About You'
      description='Update your publicly shared info'
      warning={''}
    >
      <Box component='form' onSubmit={controlForm.handleSubmit(onSubmit)}>
        <Grid
          container
          alignItems='flex-start'
          // xs={12}
          // sx={{ mt: '30px' }}
        >
          <CardContent
            sx={{
              padding: 0,
              display: 'flex',
            }}
          >
            <Grid
              item
              alignItems='center'
              justifyContent='fl#EF9A9Aex-start'
              xs={12}
              sm={4}
            >
              <label htmlFor='icon-button-file'>
                <Input
                  sx={{ display: 'none' }}
                  // disabled={disabled}
                  // style={{ display: 'none' }}
                  // accept='image/*'
                  id='icon-button-file'
                  type='file'
                  onChange={(e: any) => {
                    // @ts-ignore
                    const file = e.target.files[0]
                    // field.onChange(file)
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      // @ts-ignore
                      // controlForm.setValue('imageDrawing', {
                      //   // @ts-ignore
                      //   result: event.target.result,
                      //   file: file,
                      // })
                    }
                    reader.readAsDataURL(file)
                  }}
                />
                <Avatar
                  variant='rounded'
                  // src={user.avatar}
                  alt='no image'
                  style={{
                    width: '120px',
                    height: '120px',
                  }}
                  sx={{
                    margin: 'auto',
                  }}
                >
                  <AccountCircle
                    style={{
                      width: '100px',
                      height: '100px',
                    }}
                  />
                </Avatar>
              </label>
            </Grid>
            <Grid
              container
              spacing={0.5}
              sx={{
                ml: '2px',
              }}
            >
              <Grid item xs={12} sm={4} sx={{ mb: '7px' }}>
                <Button
                  fullWidth
                  variant='contained'
                  color='primary'
                  sx={{
                    // mt: 3, mb: 2
                    lineHeight: '1.38462',
                    fontSize: '0.8125rem',
                  }}
                >
                  Upload new photo
                </Button>
              </Grid>
              <Grid item xs={12} sm={12} sx={{ my: '5px' }}>
                <Typography fontSize='0.9375rem' lineHeight='1.46667'>
                  Allowed JPG, GIF or PNG. Max size of 800K
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Grid>
        <Grid container spacing={2}>
          {/* <Grid item xs={12} sm={12}>
              <Controller
                name='lastname'
                control={controlForm.control}
                rules={{
                  required: {
                    value: true,
                    message: 'renseigner ton nom',
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
                    error={formState?.errors?.lastName !== undefined}
                    helperText={formState?.errors?.lastName?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={12}>
              <Controller
                name='firstname'
                control={controlForm.control}
                rules={{
                  required: {
                    value: true,
                    message: 'renseigner ton prenom',
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
                    error={formState?.errors?.firstName !== undefined}
                    helperText={formState?.errors?.firstName?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={12}>
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
            </Grid>
            <Grid item xs={12} sm={12}>
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
