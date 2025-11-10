import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Link as MuiLink,
} from '@mui/material';
import { Lock } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import OtpInput from 'react-otp-input';

const OtpVerification: React.FC = () => {
  const [otp, setOtp] = useState('');

  return (
    <React.Fragment>
      <Helmet>
        <title>OTP Verification</title>
      </Helmet>
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
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 2,
            }}
          >
            <Lock sx={{ fontSize: 40, color: '#d4af37' }} />
          </Box>
          <Typography component='h1' variant='h4' sx={{ mb: 1, fontWeight: 'bold' }}>
            Enter Verification Code
          </Typography>
          <Typography
            variant='body1'
            color='text.secondary'
            align='center'
            sx={{ mb: 4 }}
          >
            We've sent a 6-digit code to your email. The code expires in 10 minutes.
          </Typography>
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
          <Box sx={{ width: '100%', textAlign: 'center', mt: 4 }}>
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
              Verify
            </Button>
            <Typography variant='body2' color='text.secondary' align='center'>
              Didn't receive the code?{' '}
              <MuiLink component={RouterLink} to='#' sx={{ color: '#8B4513', fontWeight: 'medium' }}>
                Resend
              </MuiLink>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </React.Fragment>
  );
};

export default OtpVerification;
