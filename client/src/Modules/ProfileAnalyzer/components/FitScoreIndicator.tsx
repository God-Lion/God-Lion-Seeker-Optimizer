import React from 'react';
import { Box, Typography, CircularProgress, Chip } from '@mui/material';

interface FitScoreIndicatorProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const FitScoreIndicator: React.FC<FitScoreIndicatorProps> = ({
  score,
  size = 'medium',
  showLabel = true,
}) => {
  const getColor = (score: number) => {
    if (score >= 80) return '#4CAF50'; // green
    if (score >= 60) return '#FFC107'; // yellow
    return '#F44336'; // red
  };

  const getStatus = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Fair';
  };

  const sizeMap = {
    small: 50,
    medium: 80,
    large: 120,
  };

  const size_value = sizeMap[size];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={size_value}
          sx={{ color: 'rgba(0, 0, 0, 0.1)' }}
        />
        <CircularProgress
          variant="determinate"
          value={score}
          size={size_value}
          sx={{
            position: 'absolute',
            left: 0,
            color: getColor(score),
          }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h6" component="div" color="text.secondary">
            {`${Math.round(score)}%`}
          </Typography>
        </Box>
      </Box>

      {showLabel && (
        <Chip label={getStatus(score)} size="small" color="primary" variant="outlined" />
      )}
    </Box>
  );
};
