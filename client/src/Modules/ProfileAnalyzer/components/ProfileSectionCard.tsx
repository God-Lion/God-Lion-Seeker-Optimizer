import React from 'react';
import { Paper, Typography, Box, BoxProps } from '@mui/material';

interface ProfileSectionCardProps extends BoxProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const ProfileSectionCard: React.FC<ProfileSectionCardProps> = ({
  title,
  icon,
  children,
  ...props
}) => {
  return (
    <Paper sx={{ p: 2, height: '100%' }} {...props}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {icon && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {icon}
          </Box>
        )}
        <Typography variant="subtitle2" fontWeight="bold">
          {title}
        </Typography>
      </Box>
      {children}
    </Paper>
  );
};
