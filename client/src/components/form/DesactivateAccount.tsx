import { useForm, Controller } from 'react-hook-form'
import {
  Box,
  Button,
  FormControlLabel,
  FormHelperText,
  FormControl,
  Grid,
  Paper,
  Stack,
  Typography,
  Checkbox,
} from '@mui/material'
// import { IUserReponse } from 'src/types'

export default function DesactivateAccount() {
  const controlForm = useForm({
    defaultValues: {
      user_id: NaN,
      desactivate: false,
    },
  })
  const onSubmit = async () => {}
  return (
    <Paper
      sx={{
        padding: '20px',

        mb: 4,
      }}
    >
      <Box component='form' onSubmit={controlForm.handleSubmit(onSubmit)}>
        <Grid item xs={12}>
          <Controller
            name='desactivate'
            control={controlForm.control}
            render={({ field, formState }) => (
              <FormControl
                component='fieldset'
                error={formState?.errors?.desactivate !== undefined}
              >
                <Typography variant='h6'>Delete Account </Typography>
                <FormControlLabel
                  // required
                  control={<Checkbox {...field} />}
                  label='I confirm my account deactivation'
                  labelPlacement='end'
                  // disabled={disabled}
                  onClick={() => field.onChange(!field.value)}
                  checked={field.value}
                />
                <FormHelperText>
                  {formState?.errors?.desactivate?.message}
                </FormHelperText>
              </FormControl>
            )}
          />
        </Grid>
        <Grid item xs={12} sx={{ mt: '30px' }}>
          <Stack direction='row' spacing={2} justifyContent='start'>
            <Button
              // type='reset'
              // type='submit'
              // position='left'
              variant='contained'
              color='error'
              // disabled={disabled}
              // onClick={() => {
              //   controlForm.reset()
              //   navigate('/home')
              // }}
            >
              Desactivate account
            </Button>
          </Stack>
        </Grid>
      </Box>
    </Paper>
  )
}
