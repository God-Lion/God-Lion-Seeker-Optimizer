import { Container, Paper } from '@mui/material'
import { useTheme } from '@mui/material/styles'

export default function ERR0R404() {
  const theme = useTheme()

  return (
    <Container
      component='main'
      maxWidth='lg'
      sx={{
        width: '100%',
        maxWidth: '100%',
        height: '100vh',
        margin: 0,
        padding: 0,
        [theme.breakpoints.up('lg')]: {
          width: '100%',
          maxWidth: '100%',
          margin: 0,
          padding: 0,
        },
        [theme.breakpoints.up('md')]: {
          width: '100%',
          maxWidth: '100%',
          margin: 0,
          padding: 0,
        },
        [theme.breakpoints.up('sm')]: {
          width: '100%',
          maxWidth: '100%',
          margin: 0,
          padding: 0,
        },
        [theme.breakpoints.up('xl')]: {
          width: '100%',
          maxWidth: '100%',
          margin: 0,
          padding: 0,
        },
        [theme.breakpoints.up('xs')]: {
          width: '100%',
          maxWidth: '100%',
          margin: 0,
          padding: 0,
        },
      }}
    >
      <Paper
        variant='outlined'
        sx={{ mx: { lg: 4 }, my: { xs: 3, md: 6 }, p: { lg: 4, xs: 2, md: 3 } }}
      >
        <span>OH!</span>
        <h1>Desole! Page non trouve</h1>
      </Paper>
    </Container>
  )
}
