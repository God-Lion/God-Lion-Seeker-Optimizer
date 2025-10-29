import React from 'react';
import { Modal, Box, Typography, CircularProgress, Button } from '@mui/material';

interface SubmissionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionState: 'idle' | 'loading' | 'success' | 'error';
}

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const SubmissionStatusModal: React.FC<SubmissionStatusModalProps> = ({
  isOpen,
  onClose,
  submissionState,
}) => {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="submission-status-modal-title"
      aria-describedby="submission-status-modal-description"
    >
      <Box sx={style}>
        {submissionState === 'loading' && (
          <>
            <Typography id="submission-status-modal-title" variant="h6" component="h2">
              Submitting Application...
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
            <Typography id="submission-status-modal-description" sx={{ mt: 2 }}>
              Please wait while we submit your application.
            </Typography>
          </>
        )}
        {submissionState === 'success' && (
          <>
            <Typography id="submission-status-modal-title" variant="h6" component="h2">
              Submission Successful!
            </Typography>
            <Typography id="submission-status-modal-description" sx={{ mt: 2 }}>
              Your application has been submitted successfully.
            </Typography>
            <Button onClick={onClose} sx={{ mt: 2 }}>
              Close
            </Button>
          </>
        )}
        {submissionState === 'error' && (
          <>
            <Typography id="submission-status-modal-title" variant="h6" component="h2">
              Submission Failed
            </Typography>
            <Typography id="submission-status-modal-description" sx={{ mt: 2 }}>
              There was an error submitting your application. Please try again later.
            </Typography>
            <Button onClick={onClose} sx={{ mt: 2 }}>
              Close
            </Button>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default SubmissionStatusModal;
