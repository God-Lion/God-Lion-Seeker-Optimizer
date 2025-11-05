import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  AppBar,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const SetNewPassword = () => {
  const [password, setPassword] = useState('pA$$w0rd!');
  const [confirmPassword, setConfirmPassword] = useState('pA$$w0rd!');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <React.Fragment>
      <Helmet>
        <title>Set New Password</title>
      </Helmet>
      <AppBar position='static' color='transparent' elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ maxWidth: '1280px', width: '100%', margin: '0 auto', px: { xs: 2, sm: 4 } }}>
          <Typography variant='h6' component='div' sx={{ fontWeight: 'bold' }}>
            Lion and Magnifying Glass
          </Typography>
        </Toolbar>
      </AppBar>
      <Container
        component='main'
        maxWidth='sm'
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
            width: '100%',
            maxWidth: '512px',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography component='h1' variant='h4' sx={{ fontWeight: 'black', mb: 1 }}>
              Set a New Password
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              Your new password must be different from previous passwords and meet the criteria below.
            </Typography>
          </Box>
          <form>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label='New Password'
                  variant='outlined'
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton onClick={handleClickShowPassword} edge='end'>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label='Confirm New Password'
                  variant='outlined'
                  fullWidth
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton onClick={handleClickShowConfirmPassword} edge='end'>
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
            <Box sx={{ my: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LinearProgress
                  variant='determinate'
                  value={100}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4, mr: 1, backgroundColor: '#E0E0E0' }}
                  color='success'
                />
                <Typography variant='body2' color='success.main' sx={{ fontWeight: 'medium' }}>
                  Strong
                </Typography>
              </Box>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel control={<Checkbox defaultChecked disabled />} label='At least 8 characters' />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel control={<Checkbox defaultChecked disabled />} label='Contains an uppercase letter' />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel control={<Checkbox defaultChecked disabled />} label='Contains a number' />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel control={<Checkbox defaultChecked disabled />} label='Contains a special character (!@#$%)' />
                </Grid>
              </Grid>
            </Box>
            <Button
              type='submit'
              fullWidth
              variant='contained'
              sx={{
                py: 1.5,
                backgroundColor: '#D4AF37',
                '&:hover': { backgroundColor: '#b89a30' },
                textTransform: 'none',
                fontWeight: 'bold',
              }}
            >
              Update Password
            </Button>
          </form>
        </Paper>
      </Container>
    </React.Fragment>
  );
};

export default SetNewPassword;
