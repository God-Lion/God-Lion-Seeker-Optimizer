import { AppBar, Toolbar, Typography, Button, Container, Grid, Paper, Box } from '@mui/material';
import { RocketLaunch, Description, IntegrationInstructions } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <Box sx={{ backgroundColor: 'white', color: 'black' }}>
      {/* Header */}
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            JobTrackr
          </Typography>
          <Button color="inherit" component={Link} to="/features">Features</Button>
          <Button color="inherit" component={Link} to="/pricing">Pricing</Button>
          <Button color="inherit" component={Link} to="/testimonials">Testimonials</Button>
          <Button color="inherit" component={Link} to="/login">Login</Button>
          <Button variant="contained" color="primary" component={Link} to="/signup" sx={{ ml: 2, backgroundColor: '#f0ad4e', '&:hover': { backgroundColor: '#eea236' } }}>
            Sign Up
          </Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default LandingPage;
