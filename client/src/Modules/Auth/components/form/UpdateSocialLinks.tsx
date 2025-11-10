import { useForm, Controller } from 'react-hook-form'
import { Box, Grid, TextField } from '@mui/material'
// import { FormLayout } from 'src/components/form'
import FormLayout from './FormLayout'

export default function UpdateSocialLinks() {
  const controlForm = useForm({
    defaultValues: {
      user_id: NaN,
      facebookUrl: '',
      instagramUrl: '',
      threadUrl: '',
      twitterUrl: '',
    },
  })
  const onSubmit = () => {}
  return (
    <FormLayout
      title='Update Social Links'
      description='Share where others can find you'
      warning={''}
    >
      <Box component='form' onSubmit={controlForm.handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12}>
            <Controller
              name='facebookUrl'
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
                  type='URL'
                  label='Facebook URL'
                  error={formState?.errors?.facebookUrl !== undefined}
                  helperText={formState?.errors?.facebookUrl?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={12}>
            <Controller
              name='instagramUrl'
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
                  type='url'
                  label='Instagram URL'
                  // disabled={disabled}
                  error={formState?.errors?.instagramUrl !== undefined}
                  helperText={formState?.errors?.instagramUrl?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={12}>
            <Controller
              name='threadUrl'
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
                  type='url'
                  label='Thread URL'
                  // disabled={disabled}
                  error={formState?.errors?.threadUrl !== undefined}
                  helperText={formState?.errors?.threadUrl?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={12}>
            <Controller
              name='twitterUrl'
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
                  type='url'
                  label='X (twitter) URL'
                  // disabled={disabled}
                  error={formState?.errors?.twitterUrl !== undefined}
                  helperText={formState?.errors?.twitterUrl?.message}
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
