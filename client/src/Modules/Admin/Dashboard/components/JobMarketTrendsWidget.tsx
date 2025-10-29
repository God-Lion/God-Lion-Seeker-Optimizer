import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Work,
  LocationOn,
  TrendingUp,
  AttachMoney,
  Business,
  Refresh,
} from '@mui/icons-material';
import { useAdminJobMarketTrends } from '../hooks/useAdminJobMarketTrends';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const JobMarketTrendsWidget: React.FC = () => {
  const { data: trendsData, isLoading, error, refetch } = useAdminJobMarketTrends();

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Job Market Trends" />
        <CardContent>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Job Market Trends" />
        <CardContent>
          <Alert severity="error">Failed to load job market trends</Alert>
        </CardContent>
      </Card>
    );
  }

  // Convert Chart.js data format to Recharts format
  const skillsChartData = trendsData?.topSkills?.map((skill: any) => ({
    name: skill.name,
    demand: skill.count,
  })) || [];

  return (
    <Card>
      <CardHeader
        title="Job Market Trends"
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
              Top Skills Trending
            </Typography>
            <Box sx={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="demand" fill="#36A2EB" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Hot Locations
            </Typography>
            <List dense>
              {trendsData?.hotLocations?.slice(0, 5).map((location: any, index: number) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <LocationOn color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={location.city}
                    secondary={`${location.jobCount} jobs`}
                  />
                  <Chip
                    label={`+${location.growth}%`}
                    size="small"
                    color="success"
                    icon={<TrendingUp />}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Salary Trends
            </Typography>
            <Box sx={{ mt: 2 }}>
              {trendsData?.salaryTrends?.map((trend: any, index: number) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{trend.role}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ${trend.averageSalary.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={trend.changePercentage}
                      color={trend.changePercentage > 0 ? 'success' : 'error'}
                      sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {trend.changePercentage > 0 ? '+' : ''}{trend.changePercentage}%
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Industry Growth
            </Typography>
            <List dense>
              {trendsData?.industryGrowth?.slice(0, 5).map((industry: any, index: number) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Business color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={industry.name}
                    secondary={`${industry.growthRate}% growth`}
                  />
                  <Chip
                    label={industry.jobCount}
                    size="small"
                    variant="outlined"
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default JobMarketTrendsWidget;
