import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  PersonAdd,
  Refresh,
} from '@mui/icons-material';
import { useAdminUserAnalytics } from '../hooks/useAdminUserAnalytics';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MetricCardProps {
  title: string;
  value: number | string;
  change: number;
  icon: React.ReactNode;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, color }) => {
  const isPositive = change >= 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Avatar
          sx={{
            bgcolor: `${color}.lighter`,
            color: `${color}.main`,
            width: 48,
            height: 48,
          }}
        >
          {icon}
        </Avatar>
        <Chip
          size="small"
          label={`${isPositive ? '+' : ''}${change}%`}
          color={isPositive ? 'success' : 'error'}
          icon={isPositive ? <TrendingUp /> : <TrendingDown />}
        />
      </Box>
      <Typography variant="h4" component="div" gutterBottom>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
    </Box>
  );
};

export const UserAnalyticsWidget: React.FC = () => {
  const { data: analyticsData, isLoading, error, refetch } = useAdminUserAnalytics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="User Analytics" />
        <CardContent>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="User Analytics" />
        <CardContent>
          <Alert severity="error">Failed to load user analytics</Alert>
        </CardContent>
      </Card>
    );
  }

  // Convert Chart.js data format to Recharts format
  const chartData = analyticsData?.userGrowth?.labels?.map((label: string, index: number) => ({
    name: label,
    activeUsers: analyticsData?.userGrowth?.activeUsers?.[index] || 0,
    newUsers: analyticsData?.userGrowth?.newUsers?.[index] || 0,
  })) || [];

  return (
    <Card>
      <CardHeader
        title="User Analytics"
        action={
          <IconButton onClick={() => refetch()} size="small">
            <Refresh />
          </IconButton>
        }
      />
      <CardContent>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Active Users"
              value={analyticsData?.activeUsers || 0}
              change={analyticsData?.activeUsersChange || 0}
              icon={<People />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="New Registrations"
              value={analyticsData?.newRegistrations || 0}
              change={analyticsData?.newRegistrationsChange || 0}
              icon={<PersonAdd />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="User Retention"
              value={`${analyticsData?.retentionRate || 0}%`}
              change={analyticsData?.retentionChange || 0}
              icon={<TrendingUp />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Users"
              value={analyticsData?.totalUsers || 0}
              change={analyticsData?.totalUsersChange || 0}
              icon={<People />}
              color="secondary"
            />
          </Grid>
        </Grid>

        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="activeUsers" 
                stroke="#4BC0C0" 
                strokeWidth={2}
                name="Active Users"
              />
              <Line 
                type="monotone" 
                dataKey="newUsers" 
                stroke="#36A2EB" 
                strokeWidth={2}
                name="New Registrations"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {analyticsData?.featureUsage && (
          <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Feature Usage
            </Typography>
            <Grid container spacing={2}>
              {analyticsData.featureUsage.map((feature: any, index: number) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{feature.name}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {feature.percentage}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={feature.percentage}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default UserAnalyticsWidget;
