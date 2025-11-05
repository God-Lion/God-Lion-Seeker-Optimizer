import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  AppBar,
  Toolbar,
  Link as MuiLink,
  LinearProgress,
} from '@mui/material';
import { Search, Pets } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import OtpInput from 'react-otp-input';

const AccountVerification: React.FC = () => {
  const [otp, setOtp] = useState('');

  return (
    <React.Fragment>
      <Helmet>
        <title>JobTrackr - Account Verification</title>
      </Helmet>
      <AppBar position='static' color='transparent' elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ maxWidth: '1280px', width: '100%', margin: '0 auto', px: { xs: 2, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Pets sx={{ fontSize: 40, color: '#8B4513' }} />
            <Typography variant='h6' component='div' sx={{ fontWeight: 'bold' }}>
              JobTrackr
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      <Container
        component='main'
        maxWidth='xs'
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexGrow: 1,
          py: 4,
        }}
      >
        <Paper
          elevation={0}
          variant='outlined'
          sx={{
            padding: { xs: 3, sm: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: '448px',
            gap: 4,
          }}
        >
          <Box sx={{ width: '100%' }}>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
              Step 2 of 4
            </Typography>
            <LinearProgress variant='determinate' value={50} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography component='h1' variant='h4' sx={{ mb: 1, fontWeight: 'black' }}>
              Verify Your Account
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              Please enter the 6-digit code sent to your email address.
            </Typography>
          </Box>
          <OtpInput
            value={otp}
            onChange={setOtp}
            numInputs={6}
            containerStyle={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
            inputStyle={{
              width: '3rem',
              height: '3.5rem',
              fontSize: '1.5rem',
              textAlign: 'center',
              borderRadius: '0.5rem',
              border: '1px solid #E0E0E0',
              backgroundColor: 'transparent',
            }}
            renderInput={(props) => <input {...props} />}
          />
          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <Button
              variant='contained'
              fullWidth
              sx={{
                py: 1.5,
                backgroundColor: '#d4af37',
                '&:hover': {
                  backgroundColor: '#b89a30'
                },
                textTransform: 'none',
                fontWeight: 'bold',
                mb: 2,
              }}
            >
              Verify & Continue
            </Button>
            <MuiLink component={RouterLink} to='#' sx={{ color: '#8B4513', fontWeight: 'medium' }}>
              Didn't receive a code?
            </MuiLink>
          </Box>
        </Paper>
      </Container>
    </React.Fragment>
  );
};

export default AccountVerification;
