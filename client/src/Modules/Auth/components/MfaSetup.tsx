import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  List,
  ListItem,
} from '@mui/material'
import { useSetupMfa, useVerifyMfa, useMfaStatus } from '../hooks/useAuthQuery'

export function MfaSetup() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'setup' | 'verify'>('setup')
  const [qrCode, setQrCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verifyCode, setVerifyCode] = useState('')
  
  const { data: mfaStatus } = useMfaStatus()
  const setupMutation = useSetupMfa()
  const verifyMutation = useVerifyMfa()
  
  const handleSetup = () => {
    setupMutation.mutate({ method: 'totp' }, {
      onSuccess: (response) => {
        setQrCode(response.data.qr_code_url || '')
        setBackupCodes(response.data.backup_codes)
        setStep('verify')
      },
    })
  }
  
  const handleVerify = () => {
    verifyMutation.mutate({ code: verifyCode }, {
      onSuccess: () => {
        alert('MFA enabled successfully!')
        setOpen(false)
        setStep('setup')
      },
      onError: () => {
        alert('Invalid code. Please try again.')
      },
    })
  }
  
  if (mfaStatus?.data.enabled) {
    return (
      <Alert severity="success">
        Two-factor authentication is enabled
      </Alert>
    )
  }
  
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Enable Two-Factor Authentication
      </Button>
      
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
        <DialogContent>
          {step === 'setup' && (
            <Box>
              <Typography paragraph>
                Two-factor authentication adds an extra layer of security to your account.
              </Typography>
              <Typography paragraph>
                You'll need an authenticator app like Google Authenticator or Authy.
              </Typography>
            </Box>
          )}
          
          {step === 'verify' && (
            <Box>
              <Typography paragraph>
                1. Scan this QR code with your authenticator app:
              </Typography>
              {qrCode && <img src={qrCode} alt="QR Code" style={{ width: '200px' }} />}
              
              <Typography paragraph sx={{ mt: 2 }}>
                2. Save these backup codes in a secure location:
              </Typography>
              <List dense>
                {backupCodes.map((code, idx) => (
                  <ListItem key={idx}>
                    <code>{code}</code>
                  </ListItem>
                ))}
              </List>
              
              <TextField
                fullWidth
                label="Enter verification code"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                margin="normal"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          {step === 'setup' && (
            <Button onClick={handleSetup} disabled={setupMutation.isPending}>
              Continue
            </Button>
          )}
          {step === 'verify' && (
            <Button onClick={handleVerify} disabled={verifyMutation.isPending}>
              Verify & Enable
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  )
}