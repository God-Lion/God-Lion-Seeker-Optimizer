import React from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Stepper,
  Step,
  StepLabel,
  Stack,
  Alert,
} from '@mui/material';
import { ProfileData } from '../types';
import { SkillBadge } from '../components/SkillBadge';
import { ProfileSectionCard } from '../components/ProfileSectionCard';
import EditIcon from '@mui/icons-material/Edit';
import SchoolIcon from '@mui/icons-material/School';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import CodeIcon from '@mui/icons-material/Code';
import PsychologyIcon from '@mui/icons-material/Psychology';

interface ProfileSummaryViewProps {
  profile: ProfileData;
  onEdit?: () => void;
  onContinue?: () => void;
  onReset?: () => void;
}

export const ProfileSummaryView: React.FC<ProfileSummaryViewProps> = ({
  profile,
  onEdit,
  onContinue,
  onReset,
}) => {
  // Debug logging
  React.useEffect(() => {
    console.log('ProfileSummaryView - Profile data:', profile);
  }, [profile]);

  // Check if we have any meaningful data to display
  const hasEducation = profile.education && profile.education.length > 0;
  const hasCertifications = profile.certifications && profile.certifications.length > 0;
  const hasTechnicalSkills = profile.skills.technical && profile.skills.technical.length > 0;
  const hasSoftSkills = profile.skills.soft && profile.skills.soft.length > 0;
  const hasExperience = profile.experience && profile.experience.totalYears >= 0;
  const hasCompanies = profile.experience?.companies && profile.experience.companies.length > 0;

  // Show warning if profile has very little data
  const hasMinimalData = !hasEducation && !hasCertifications && !hasTechnicalSkills;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stepper activeStep={1} sx={{ mb: 4 }}>
        <Step completed>
          <StepLabel>Upload Resume</StepLabel>
        </Step>
        <Step>
          <StepLabel>Review Profile</StepLabel>
        </Step>
        <Step>
          <StepLabel>Career Recommendations</StepLabel>
        </Step>
        <Step>
          <StepLabel>Find Jobs</StepLabel>
        </Step>
      </Stepper>

      {hasMinimalData && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Some profile information may be incomplete. You can still continue to see job recommendations based on available data.
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">
          Your Profile Summary
        </Typography>
        {onEdit && (
          <Button startIcon={<EditIcon />} variant="outlined" onClick={onEdit}>
            Edit
          </Button>
        )}
      </Box>

      {/* Profile Summary */}
      {profile.summary && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.50' }}>
          <Typography variant="body1" color="text.secondary">
            {profile.summary}
          </Typography>
        </Paper>
      )}

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {/* Education */}
        <Grid item xs={12} md={6}>
          <ProfileSectionCard
            title="Education"
            icon={<SchoolIcon color="primary" />}
          >
            <Stack spacing={1}>
              {hasEducation ? (
                profile.education.map((edu, idx) => (
                  <Typography key={idx} variant="body2">
                    {edu}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No education information available
                </Typography>
              )}
            </Stack>
          </ProfileSectionCard>
        </Grid>

        {/* Certifications */}
        <Grid item xs={12} md={6}>
          <ProfileSectionCard
            title="Certifications"
            icon={<WorkspacePremiumIcon color="primary" />}
          >
            <Stack spacing={1}>
              {hasCertifications ? (
                profile.certifications.map((cert, idx) => (
                  <Typography key={idx} variant="body2">
                    {cert}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No certifications listed
                </Typography>
              )}
            </Stack>
          </ProfileSectionCard>
        </Grid>

        {/* Experience */}
        {hasExperience && (
          <Grid item xs={12} md={6}>
            <ProfileSectionCard
              title="Experience"
              icon={<WorkIcon color="primary" />}
            >
              <Typography variant="body2">
                <strong>{profile.experience.totalYears} years</strong>
              </Typography>
              {profile.experience.roles && profile.experience.roles.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Recommended roles: {profile.experience.roles.slice(0, 3).join(', ')}
                </Typography>
              )}
            </ProfileSectionCard>
          </Grid>
        )}

        {/* Companies */}
        {hasCompanies && (
          <Grid item xs={12} md={6}>
            <ProfileSectionCard
              title="Companies"
              icon={<BusinessIcon color="primary" />}
            >
              <Stack spacing={0.5}>
                {profile.experience.companies.map((company, idx) => (
                  <Typography key={idx} variant="body2">
                    {company}
                  </Typography>
                ))}
              </Stack>
            </ProfileSectionCard>
          </Grid>
        )}

        {/* Technical Skills */}
        {hasTechnicalSkills && (
          <Grid item xs={12}>
            <ProfileSectionCard
              title="Technical Skills"
              icon={<CodeIcon color="primary" />}
            >
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {profile.skills.technical.map((skill, idx) => (
                  <SkillBadge key={idx} skill={skill} matched={true} />
                ))}
              </Box>
            </ProfileSectionCard>
          </Grid>
        )}

        {/* Soft Skills */}
        {hasSoftSkills && (
          <Grid item xs={12}>
            <ProfileSectionCard
              title="Soft Skills"
              icon={<PsychologyIcon color="primary" />}
            >
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {profile.skills.soft.map((skill, idx) => (
                  <SkillBadge key={idx} skill={skill} matched={true} />
                ))}
              </Box>
            </ProfileSectionCard>
          </Grid>
        )}

        {/* Show message if no skills found */}
        {!hasTechnicalSkills && !hasSoftSkills && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No skills information extracted from the resume. You can still continue to see role recommendations.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {onReset && (
          <Button variant="outlined" onClick={onReset}>
            Reset
          </Button>
        )}
        {onContinue && (
          <Button variant="contained" onClick={onContinue}>
            View Career Recommendations
          </Button>
        )}
      </Box>
    </Container>
  );
};
