import { Stack, Button } from '@mui/material'
import { Link } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'

const AuthButtons = () => {
  const theme = useTheme()

  return (
    <Stack direction='row' spacing={2} marginLeft='10px'>
      <Button
        component={Link}
        to='/auth/signup'
        variant='outlined'
        size='small'
        style={{
          textDecoration: 'none',
          color: theme.palette.primary.main,
        }}
      >
        Sign up
      </Button>
      <Button
        component={Link}
        to='/auth/signin'
        variant='contained'
        size='small'
        style={{
          textDecoration: 'none',
          color: theme.palette.primary.contrastText,
        }}
      >
        Sign in
      </Button>
    </Stack>
  )
}

export default AuthButtons
