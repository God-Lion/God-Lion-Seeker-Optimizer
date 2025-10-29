import { Card, CardHeader, CardContent, Alert, AlertTitle, TextField, InputAdornment, IconButton, Button, Box } from '@mui/material'
import React from 'react'

// MUI Imports
// import Card from '@mui/material/Card'
// import CardHeader from '@mui/material/CardHeader'
// import CardContent from '@mui/material/CardContent'
// import Grid from '@mui/material/Grid'
// import InputAdornment from '@mui/material/InputAdornment'
// import IconButton from '@mui/material/IconButton'
// import Alert from '@mui/material/Alert'
// import AlertTitle from '@mui/material/AlertTitle'
// import Button from '@mui/material/Button'

const ChangePassword = () => {
  // States
  const [isPasswordShown, setIsPasswordShown] = React.useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] =
    React.useState(false)

  return (
    <Card>
      <CardHeader title='Change Password' />
      <CardContent className='flex flex-col gap-4'>
        <Alert icon={false} severity='warning' onClose={() => {}}>
          <AlertTitle>Ensure that these requirements are met</AlertTitle>
          Minimum 8 characters long, uppercase & symbol
        </Alert>
        <form>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 300px' }}>
                <TextField
                  fullWidth
                  label='Password'
                  type={isPasswordShown ? 'text' : 'password'}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          edge='end'
                          onClick={() => setIsPasswordShown(!isPasswordShown)}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <i
                            className={
                              isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'
                            }
                          />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px' }}>
                <TextField
                  fullWidth
                  label='Confirm Password'
                  type={isConfirmPasswordShown ? 'text' : 'password'}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          edge='end'
                          onClick={() =>
                            setIsConfirmPasswordShown(!isConfirmPasswordShown)
                          }
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <i
                            className={
                              isConfirmPasswordShown
                                ? 'tabler-eye-off'
                                : 'tabler-eye'
                            }
                          />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant='contained'>Change Password</Button>
            </Box>
          </Box>
        </form>
      </CardContent>
    </Card>
  )
}

export default ChangePassword
