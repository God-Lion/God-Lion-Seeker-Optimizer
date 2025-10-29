import React from 'react';
import { Button, CircularProgress } from '@mui/material';

interface AutomatedSubmissionButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

const AutomatedSubmissionButton: React.FC<AutomatedSubmissionButtonProps> = ({
  onClick,
  isLoading,
}) => {
  return (
    <Button
      variant="contained"
      color="primary"
      onClick={onClick}
      disabled={isLoading}
      startIcon={isLoading ? <CircularProgress size={20} /> : null}
    >
      {isLoading ? 'Submitting...' : 'Apply Automatically'}
    </Button>
  );
};

export default AutomatedSubmissionButton;
