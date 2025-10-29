import React from 'react';
import { Container, Box, Typography, Paper, Button, Stepper, Step, StepLabel } from '@mui/material';
import { ProfileUploadZone } from '../components/ProfileUploadZone';

interface UploadViewProps {
  onUpload: (file: File) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const UploadView: React.FC<UploadViewProps> = ({ onUpload, loading, error }) => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Resume Analyzer
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Upload your resume to get job recommendations tailored to your skills and experience
        </Typography>
      </Box>

      <Paper elevation={1} sx={{ p: 4, mb: 4 }}>
        <Stepper activeStep={0} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Upload Resume</StepLabel>
          </Step>
          <Step>
            <StepLabel>Review Resume</StepLabel>
          </Step>
          <Step>
            <StepLabel>View Recommendations</StepLabel>
          </Step>
        </Stepper>

        <ProfileUploadZone onUpload={onUpload} loading={loading} error={error} />

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            💡 Tip: Upload a recent resume in PDF or DOCX format for best results
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};
