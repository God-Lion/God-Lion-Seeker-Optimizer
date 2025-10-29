import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Work,
  Business,
  NavigateNext,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const Analytics: React.FC = () => {
  // Convert Chart.js data format to Recharts format
  const userGrowthData = [
    { name: 'Jan', users: 120 },
    { name: 'Feb', users: 190 },
    { name: 'Mar', users: 300 },
    { name: 'Apr', users: 500 },
    { name: 'May', users: 650 },
    { name: 'Jun', users: 800 },
  ];

  const jobDistributionData = [
    { name: 'Technology', value: 300, color: '#FF6384' },
    { name: 'Finance', value: 150, color: '#36A2EB' },
    { name: 'Healthcare', value: 100, color: '#FFCE56' },
    { name: 'Education', value: 80, color: '#4BC0C0' },
    { name: 'Other', value: 70, color: '#9966FF' },
  ];

  const topSkillsData = [
    { name: 'React', demand: 450 },
    { name: 'Python', demand: 380 },
    { name: 'Java', demand: 320 },
    { name: 'AWS', demand: 290 },
    { name: 'Docker', demand: 250 },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
          <Link underline="hover" color="inherit" href="/admin">
            <DashboardIcon sx={{ mr: 0.5 }} fontSize="small" />
            Admin
          </Link>
          <Typography color="text.primary">Analytics</Typography>
        </Breadcrumbs>

        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Platform Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive analytics and insights
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Total Users
                </Typography>
              </Box>
              <Typography variant="h4">1,234</Typography>
              <Typography variant="body2" color="success.main">
                +15% from last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Work color="success" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Total Jobs
                </Typography>
              </Box>
              <Typography variant="h4">45,678</Typography>
              <Typography variant="body2" color="success.main">
                +8% from last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Business color="info" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Companies
                </Typography>
              </Box>
              <Typography variant="h4">892</Typography>
              <Typography variant="body2" color="success.main">
                +12% from last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp color="warning" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Engagement
                </Typography>
              </Box>
              <Typography variant="h4">78%</Typography>
              <Typography variant="body2" color="success.main">
                +5% from last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* User Growth Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Growth Over Time
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#4BC0C0" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Job Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Job Distribution by Industry
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={jobDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {jobDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Top Skills */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Skills in Demand
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSkillsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="demand" fill="#36A2EB" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Analytics;
