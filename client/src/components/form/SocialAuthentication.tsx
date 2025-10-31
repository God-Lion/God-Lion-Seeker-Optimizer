import { Button, Grid } from '@mui/material'
import 'react-phone-input-2/lib/style.css'
import { Facebook, Google } from '@mui/icons-material'
// import { IUserReponse } from 'src/types'
import { FormLayout } from 'src/components/form'

export default function SocialAuthentication() {
  return (
    <FormLayout
      title='Social Authentication'
      description='Manage your ability to login with a social provider in addition to your email and password'
      warning={''}
    >
      <Grid container spacing={2} sx={{ mt: '30px' }}>
        <Grid item xs={6}>
          <Button fullWidth variant='outlined' color='primary'>
            <Google />
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button fullWidth variant='outlined' color='primary'>
            <Facebook />
          </Button>
        </Grid>
      </Grid>
    </FormLayout>
  )
}
