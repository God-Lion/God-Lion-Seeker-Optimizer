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
  Chip,
} from '@mui/material';
import { Refresh, ArrowForward } from '@mui/icons-material';
import { useAdminUserFunnel } from '../hooks/useAdminUserFunnel';

interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
  dropOff: number;
  color: string;
}

export const UserFunnelWidget: React.FC = () => {
  const { data: funnelData, isLoading, error, refetch } = useAdminUserFunnel();

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="User Conversion Funnel" />
        <CardContent>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="User Conversion Funnel" />
        <CardContent>
          <Alert severity="error">Failed to load funnel data</Alert>
        </CardContent>
      </Card>
    );
  }

  const stages: FunnelStage[] = funnelData?.stages || [
    { name: 'Visitors', count: 10000, percentage: 100, dropOff: 0, color: '#2196F3' },
    { name: 'Guest Users', count: 5000, percentage: 50, dropOff: 50, color: '#4CAF50' },
    { name: 'Sign Ups', count: 2000, percentage: 20, dropOff: 60, color: '#FF9800' },
    { name: 'Active Users', count: 1500, percentage: 15, dropOff: 25, color: '#F44336' },
    { name: 'Paid Users', count: 300, percentage: 3, dropOff: 80, color: '#9C27B0' },
  ];

  const maxCount = Math.max(...stages.map(s => s.count));

  return (
    <Card>
      <CardHeader
        title="User Conversion Funnel"
        subheader={`Overall Conversion Rate: ${funnelData?.overallConversionRate || 3}%`}
        action={
          <IconButton onClick={() => refetch()} size="small">
            <Refresh />
          </IconButton>
        }
      />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {stages.map((stage, index) => {
            const width = (stage.count / maxCount) * 100;
            const isLast = index === stages.length - 1;

            return (
              <Box key={index}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {stage.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {stage.count.toLocaleString()} ({stage.percentage}%)
                    </Typography>
                    {stage.dropOff > 0 && (
                      <Chip
                        label={`-${stage.dropOff}%`}
                        size="small"
                        color="error"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                </Box>
                <Box
                  sx={{
                    width: `${width}%`,
                    height: 40,
                    bgcolor: stage.color,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: 2,
                    },
                  }}
                >
                  {stage.percentage}%
                </Box>
                {!isLast && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                    <ArrowForward color="action" fontSize="small" />
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>

        <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom>
            Key Insights
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {funnelData?.insights?.map((insight: string, index: number) => (
              <Typography key={index} variant="body2" color="text.secondary">
                • {insight}
              </Typography>
            )) || (
              <>
                <Typography variant="body2" color="text.secondary">
                  • 50% of visitors become guest users
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • 40% conversion from guest to registered users
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • 75% of registered users remain active
                </Typography>
              </>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default UserFunnelWidget;
