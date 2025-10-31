import React from 'react'
import { Paper, Typography } from '@mui/material'
import { ISession, IUserReponse } from 'src/types'
import { Layout } from './form'

export default function ActiveSessions() {
  return (
    <Paper
      sx={{
        padding: '20px',
        mb: 4,
      }}
    >
      <Layout title='Active Sessions'>
        <Typography>
          Below are the active sessions for your account. Active sessions are
          sessions that haven't signed out or expired. Location information is
          provided by IP2Location and is based on the IP Address of the session,
          accuracy will vary depending on the ISP/VPN.
        </Typography>
      </Layout>
    </Paper>
  )
}
