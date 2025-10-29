import React from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import Grid from 'src/components/Grid';
import { ProfileData, MatchingResult } from '../types';
import { SkillBadge } from '../components/SkillBadge';
import { ProfileSectionCard } from '../components/ProfileSectionCard';
import { jobMatchingEngine } from '../services/matchingEngine';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface SkillAnalysisViewProps {
  profile: ProfileData;
  selectedMatch: MatchingResult;
  onBack: () => void;
  onViewJobDetails: () => void;
}

export const SkillAnalysisView: React.FC<SkillAnalysisViewProps> = ({
  profile,
  selectedMatch,
  onBack,
  onViewJobDetails,
}) => {
  const skillGaps = jobMatchingEngine.getSkillGaps(profile, selectedMatch.job);

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical':
        return 'error';
      case 'important':
        return 'warning';
      case 'nice-to-have':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stepper activeStep={2} sx={{ mb: 4 }}>
        <Step completed>
          <StepLabel>Upload Resume</StepLabel>
        </Step>
        <Step completed>
          <StepLabel>Review Profile</StepLabel>
        </Step>
        <Step>
          <StepLabel>Skill Analysis</StepLabel>
        </Step>
      </Stepper>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Skill Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedMatch.job.title} at {selectedMatch.job.company_name}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={onBack}>
          Back to Jobs
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Matched Skills */}
        <Grid item xs={12} md={6}>
          <ProfileSectionCard
            title="Matched Skills"
            icon={<CheckCircleIcon color="success" />}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Skills you have that match this job ({selectedMatch.matchedSkills.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {selectedMatch.matchedSkills.map((skill, idx) => (
                <SkillBadge key={idx} skill={skill} matched={true} />
              ))}
            </Box>
          </ProfileSectionCard>
        </Grid>

        {/* Missing Skills */}
        <Grid item xs={12} md={6}>
          <ProfileSectionCard
            title="Missing Skills"
            icon={<WarningIcon color="warning" />}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Skills you need to develop ({skillGaps.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {skillGaps.map((gap, idx) => (
                <Chip
                  key={idx}
                  label={gap.skill}
                  color={getImportanceColor(gap.importance) as any}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </ProfileSectionCard>
        </Grid>

        {/* Skill Gap Details */}
        <Grid item xs={12}>
          <ProfileSectionCard
            title="Detailed Skill Gap Analysis"
            icon={<TrendingUpIcon color="primary" />}
          >
            {skillGaps.length === 0 ? (
              <Alert severity="success">
                Congratulations! You have all the required skills for this position.
              </Alert>
            ) : (
              <List>
                {skillGaps.map((gap, index) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Chip
                          label={gap.importance}
                          size="small"
                          color={getImportanceColor(gap.importance) as any}
                          variant="outlined"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight="bold">
                            {gap.skill}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Estimated learning time: {gap.estimatedLearningHours} hours
                            </Typography>
                            {gap.resources && gap.resources.length > 0 && (
                              <Box>
                                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                                  Learning Resources:
                                </Typography>
                                <List dense sx={{ py: 0 }}>
                                  {gap.resources.map((resource, resIndex) => (
                                    <ListItem key={resIndex} sx={{ py: 0, px: 0 }}>
                                      <ListItemText
                                        primary={
                                          <Typography variant="body2" color="primary">
                                            • {resource}
                                          </Typography>
                                        }
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < skillGaps.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </ProfileSectionCard>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={onBack}>
          Back to Jobs
        </Button>
        <Button variant="contained" onClick={onViewJobDetails}>
          View Job Details
        </Button>
      </Box>
    </Container>
  );
};
