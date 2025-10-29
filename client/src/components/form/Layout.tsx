import React from 'react'
import { Stack, Typography, Divider } from '@mui/material'

export default function Layout({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Stack direction='column'>
      <Typography variant='h5' component='div'>
        {title}
      </Typography>
      <Divider sx={{ my: '25px' }} />
      {children}
    </Stack>
  )
}
