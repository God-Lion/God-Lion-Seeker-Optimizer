import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  IconButton,
  LinearProgress,
  Alert,
  Grid,
  Chip,
  Rating,
} from '@mui/material';
import {
  Refresh,
  ThumbUp,
  Visibility,
  Work,
  TrendingUp,
} from '@mui/icons-material';
import { useAdminRecommendationPerformance } from '../hooks/useAdminRecommendationPerformance';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export const RecommendationPerformanceWidget: React.FC = () => {
  const { data: performanceData, isLoading, error, refetch } = useAdminRecommendationPerformance();

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Recommendation Performance" />
        <CardContent>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Recommendation Performance" />
        <CardContent>
          <Alert severity="error">Failed to load performance data</Alert>
        </CardContent>
      </Card>
    );
  }

  // Convert Chart.js data format to Recharts format
  const clickThroughData = [
    { name: 'Clicked', value: performanceData?.clickThroughRate || 35, color: '#4CAF50' },
    { name: 'Viewed Only', value: performanceData?.viewRate || 45, color: '#2196F3' },
    { name: 'Ignored', value: performanceData?.ignoreRate || 20, color: '#F44336' },
  ];

  const metrics = [
    {
      label: 'Click-Through Rate',
      value: `${performanceData?.clickThroughRate || 35}%`,
      icon: <Visibility />,
      color: 'primary',
      trend: performanceData?.clickThroughTrend || 5,
    },
    {
      label: 'Application Rate',
      value: `${performanceData?.applicationRate || 15}%`,
      icon: <Work />,
      color: 'success',
      trend: performanceData?.applicationTrend || 3,
    },
    {
      label: 'User Satisfaction',
      value: performanceData?.satisfactionScore || 4.2,
      icon: <ThumbUp />,
      color: 'info',
      trend: performanceData?.satisfactionTrend || 2,
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Recommendation Performance"
        action={
          <IconButton onClick={() => refetch()} size="small">
            <Refresh />
          </IconButton>
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Engagement Overview
            </Typography>
            <Box sx={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clickThroughData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {clickThroughData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
              Key Metrics
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {metrics.map((metric, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ color: `${metric.color}.main` }}>
                        {metric.icon}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {metric.label}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={`+${metric.trend}%`}
                      color="success"
                      icon={<TrendingUp />}
                    />
                  </Box>
                  <Typography variant="h5" component="div">
                    {typeof metric.value === 'number' && metric.label === 'User Satisfaction' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{metric.value}</span>
                        <Rating value={metric.value} precision={0.1} readOnly size="small" />
                      </Box>
                    ) : (
                      metric.value
                    )}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" gutterBottom>
                Top Performing Recommendations
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                {performanceData?.topRecommendations?.map((rec: any, index: number) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {rec.jobTitle}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {rec.company} • {rec.location}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip label={`${rec.successRate}% success`} size="small" color="success" />
                      <Chip label={`${rec.applications} applies`} size="small" variant="outlined" />
                    </Box>
                  </Box>
                )) || (
                  <Typography variant="body2" color="text.secondary">
                    No data available
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default RecommendationPerformanceWidget;
