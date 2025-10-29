import React from 'react';
import { Chip, ChipProps } from '@mui/material';

interface SkillBadgeProps extends Omit<ChipProps, 'label'> {
  skill: string;
  matched?: boolean;
  icon?: React.ReactNode;
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({
  skill,
  matched = false,
  icon,
  ...props
}) => {
  return (
    <Chip
      label={skill}
      icon={icon}
      variant={matched ? 'filled' : 'outlined'}
      color={matched ? 'success' : 'default'}
      size="small"
      {...props}
    />
  );
};
