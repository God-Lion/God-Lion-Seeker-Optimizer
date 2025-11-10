import {
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Typography,
  Chip,
  Box,
} from '@mui/material'
import { Delete as DeleteIcon, Devices as DevicesIcon } from '@mui/icons-material'
import { useSessions, useRevokeSession, useRevokeAllSessions } from '../hooks/useAuthQuery'

export function ActiveSessions() {
  const { data, isLoading } = useSessions()
  const revokeSessionMutation = useRevokeSession()
  const revokeAllMutation = useRevokeAllSessions()
  
  if (isLoading) return <div>Loading...</div>
  
  const handleRevokeSession = (sessionId: string) => {
    if (confirm('Are you sure you want to end this session?')) {
      revokeSessionMutation.mutate(sessionId, {
        onSuccess: () => alert('Session ended successfully'),
      })
    }
  }
  
  const handleRevokeAll = () => {
    if (confirm('This will log you out from all other devices. Continue?')) {
      revokeAllMutation.mutate(undefined, {
        onSuccess: () => alert('All other sessions ended successfully'),
      })
    }
  }
  
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Active Sessions</Typography>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={handleRevokeAll}
            disabled={!data?.sessions || data.sessions.length <= 1}
          >
            End All Other Sessions
          </Button>
        </Box>
        
        <List>
          {data?.sessions.map((session) => (
            <ListItem
              key={session.id}
              secondaryAction={
                !session.current && (
                  <IconButton
                    edge="end"
                    onClick={() => handleRevokeSession(session.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )
              }
            >
              <DevicesIcon sx={{ mr: 2 }} />
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    {session.device_name}
                    {session.current && (
                      <Chip label="Current" size="small" color="primary" />
                    )}
                  </Box>
                }
                secondary={`${session.ip_address} · Last active: ${new Date(
                  session.last_activity
                ).toLocaleString()}`}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  )
}
// import { Paper, Typography } from '@mui/material'
// import { Layout } from './form'

// export default function ActiveSessions() {
//   return (
//     <Paper
//       sx={{
//         padding: '20px',
//         mb: 4,
//       }}
//     >
//       <Layout title='Active Sessions'>
//         <Typography>
//           Below are the active sessions for your account. Active sessions are
//           sessions that haven't signed out or expired. Location information is
//           provided by IP2Location and is based on the IP Address of the session,
//           accuracy will vary depending on the ISP/VPN.
//         </Typography>
//       </Layout>
//     </Paper>
//   )
// }
