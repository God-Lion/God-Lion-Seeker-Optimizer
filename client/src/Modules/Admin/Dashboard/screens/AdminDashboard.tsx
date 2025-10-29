import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Breadcrumbs,
  Link,
  Alert,
} from '@mui/material';
import Grid from 'src/components/Grid';
import { NavigateNext, Dashboard as DashboardIcon } from '@mui/icons-material';
import {
  SystemHealthWidget,
  UserAnalyticsWidget,
  JobMarketTrendsWidget,
  UserFunnelWidget,
  RecommendationPerformanceWidget,
} from '../components';

export const AdminDashboard: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 2 }}
        >
          <Link
            underline="hover"
            color="inherit"
            href="/admin"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <DashboardIcon sx={{ mr: 0.5 }} fontSize="small" />
            Admin
          </Link>
          <Typography color="text.primary">Dashboard</Typography>
        </Breadcrumbs>

        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor system health, user activity, and overall platform performance
        </Typography>
      </Box>

      {/* Admin Role Indicator */}
      <Alert severity="info" sx={{ mb: 3 }} icon={<DashboardIcon />}>
        You are viewing the admin dashboard. All data shown is aggregated across the entire platform.
      </Alert>

      {/* Dashboard Widgets */}
      <Grid container spacing={3}>
        {/* System Health - Full Width */}
        <Grid item xs={12}>
          <SystemHealthWidget />
        </Grid>

        {/* User Analytics - Full Width */}
        <Grid item xs={12}>
          <UserAnalyticsWidget />
        </Grid>

        {/* User Funnel & Recommendation Performance - Side by Side */}
        <Grid item xs={12} lg={6}>
          <UserFunnelWidget />
        </Grid>
        <Grid item xs={12} lg={6}>
          <RecommendationPerformanceWidget />
        </Grid>

        {/* Job Market Trends - Full Width */}
        <Grid item xs={12}>
          <JobMarketTrendsWidget />
        </Grid>
      </Grid>

      {/* Footer Info */}
      <Paper sx={{ mt: 4, p: 2, bgcolor: 'background.default' }}>
        <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
          Dashboard data refreshes automatically. Last updated: {new Date().toLocaleString()}
        </Typography>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
