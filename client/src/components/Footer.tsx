/* eslint-disable prettier/prettier */
import { Box, Container, Typography } from '@mui/material'
import Copyright from './Copyright'

export default function Footer({
  title = 'titre',
  description = 'description',
}: {
  title?: string
  description?: string
}) {
  return (
    <Box
      component='footer'
      sx={{ bgcolor: 'background.paper', mt: 'auto', py: 6 }}
    >
      <Container maxWidth='lg'>
        <Typography variant='h6' align='center' gutterBottom>
          {title}
        </Typography>
        <Typography
          variant='subtitle1'
          align='center'
          color='text.secondary'
          component='p'
        >
          {description}
        </Typography>
        <Copyright />
      </Container>
    </Box>
  )
}
