import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  TextField,
  AppBar,
  Toolbar,
  Link as MuiLink,
} from '@mui/material';
import { MailOutline } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const EmailVerification: React.FC = () => {
  return (
    <React.Fragment>
      <Helmet>
        <title>Email Verification</title>
        <meta
          name='description'
          content='Verify your email to activate your account.'
        />
      </Helmet>
      <AppBar position='static' color='transparent' elevation={0} sx={{ px: { xs: 2, sm: 4 } }}>
        <Toolbar>
          <Typography variant='h6' component='div' sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            AutoApply
          </Typography>
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
          minHeight: 'calc(100vh - 64px)', // Adjust for AppBar height
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
            maxWidth: '448px', // Corresponds to max-w-md
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'rgba(212, 175, 55, 0.1)', // primary/20
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 2,
            }}
          >
            <MailOutline sx={{ fontSize: 40, color: '#d4af37' }} />
          </Box>
          <Typography component='h1' variant='h4' sx={{ mb: 1, fontWeight: 'bold' }}>
            Verify Your Email
          </Typography>
          <Typography
            variant='body1'
            color='text.secondary'
            align='center'
            sx={{ mb: 4 }}
          >
            We've sent a verification link to your registered email address.
            Please click the link to activate your account.
          </Typography>
          <TextField
            label='Email Address'
            fullWidth
            disabled
            value='user@example.com'
            sx={{ mb: 2 }}
          />
          <Button
            variant='contained'
            fullWidth
            sx={{
              mb: 2,
              py: 1.5,
              backgroundColor: '#d4af37',
              '&:hover': {
                backgroundColor: '#b89a30'
              },
              textTransform: 'none',
              fontWeight: 'bold',
            }}
          >
            Resend Verification Email
          </Button>
          <Typography variant='body2' color='text.secondary' align='center'>
            Didn't receive the email? Check your spam folder or{' '}
            <MuiLink component={RouterLink} to='#' sx={{ color: '#8B4513', fontWeight: 'medium' }}>
              contact support
            </MuiLink>
            .
          </Typography>
        </Paper>
      </Container>
    </React.Fragment>
  );
};

export default EmailVerification;
