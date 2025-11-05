import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Memory,
  Storage,
  Speed,
  Api,
} from '@mui/icons-material';
import { useAdminSystemHealth } from '../hooks/useAdminSystemHealth';

interface HealthMetric {
  label: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  icon: React.ReactNode;
}

export const SystemHealthWidget: React.FC = () => {
  const { data: healthData, isLoading, error } = useAdminSystemHealth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string): React.ReactElement | undefined => {
    switch (status) {
      case 'healthy':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'critical':
        return <Error color="error" />;
      default:
        return undefined;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="System Health" />
        <CardContent>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="System Health" />
        <CardContent>
          <Alert severity="error">Failed to load system health data</Alert>
        </CardContent>
      </Card>
    );
  }

  const metrics: HealthMetric[] = [
    {
      label: 'Server Uptime',
      value: healthData?.uptime || 0,
      unit: 'days',
      status: healthData?.uptime > 1 ? 'healthy' : 'warning',
      icon: <Speed />,
    },
    {
      label: 'API Response Time',
      value: healthData?.apiResponseTime || 0,
      unit: 'ms',
      status: healthData?.apiResponseTime < 500 ? 'healthy' : healthData?.apiResponseTime < 1000 ? 'warning' : 'critical',
      icon: <Api />,
    },
    {
      label: 'CPU Usage',
      value: healthData?.cpuUsage || 0,
      unit: '%',
      status: healthData?.cpuUsage < 70 ? 'healthy' : healthData?.cpuUsage < 85 ? 'warning' : 'critical',
      icon: <Memory />,
    },
    {
      label: 'Database Performance',
      value: healthData?.dbResponseTime || 0,
      unit: 'ms',
      status: healthData?.dbResponseTime < 100 ? 'healthy' : healthData?.dbResponseTime < 300 ? 'warning' : 'critical',
      icon: <Storage />,
    },
  ];

  return (
    <Card>
      <CardHeader
        title="System Health"
        action={
          <Chip
            label={healthData?.overallStatus || 'Unknown'}
            color={getStatusColor(healthData?.overallStatus || 'default')}
            {...(getStatusIcon(healthData?.overallStatus || 'default') && {
              icon: getStatusIcon(healthData?.overallStatus || 'default'),
            })}
            size="small"
          />
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          {metrics.map((metric, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ mr: 1, color: `${getStatusColor(metric.status)}.main` }}>
                  {metric.icon}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {metric.label}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                <Typography variant="h4" component="span">
                  {metric.value.toFixed(metric.unit === 'days' ? 0 : 2)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  {metric.unit}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={metric.unit === '%' ? metric.value : Math.min((metric.value / (metric.unit === 'ms' ? 1000 : 30)) * 100, 100)}
                color={getStatusColor(metric.status) as any}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Grid>
          ))}
        </Grid>

        {healthData?.scrapingStats && (
          <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Scraping Performance
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Success Rate
                </Typography>
                <Typography variant="h6" color="success.main">
                  {healthData.scrapingStats.successRate}%
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Failure Rate
                </Typography>
                <Typography variant="h6" color="error.main">
                  {healthData.scrapingStats.failureRate}%
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemHealthWidget;
