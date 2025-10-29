import React, { useState, useEffect } from 'react';
import { Box, Alert, Snackbar, Container, Typography, Paper, Grid, Button, Chip, Stack, LinearProgress } from '@mui/material';
import { useProfileAnalyzer } from '../hooks/useProfileAnalyzer';
import { useJobMatching } from '../hooks/useJobMatching';
import { UploadView } from '../views/UploadView';
import { ProfileSummaryView } from '../views/ProfileSummaryView';
import { JobRecommendationsView } from '../views/JobRecommendationsView';
import { SkillAnalysisView } from '../views/SkillAnalysisView';
import { MissingSkillsModal } from '../components/MissingSkillsModal';
import { jobMatchingEngine } from '../services/matchingEngine';
import { MatchingResult } from '../types';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WorkIcon from '@mui/icons-material/Work';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';

export const CandidateProfilePage: React.FC = () => {
  const {
    profile,
    loading,
    error,
    step,
    uploadProfile,
    moveToStep,
    reset,
  } = useProfileAnalyzer();

  const {
    matches: filteredMatches,
    loading: matchingLoading,
    findMatches,
  } = useJobMatching(profile);

  const [selectedMatch, setSelectedMatch] = useState<MatchingResult | null>(null);
  const [showSkillGapsModal, setShowSkillGapsModal] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Debug logging
  useEffect(() => {
    console.log('=== CandidateProfilePage State ===');
    console.log('Current step:', step);
    console.log('Profile:', profile);
    console.log('Loading:', loading);
    console.log('Error:', error);
    console.log('================================');
  }, [profile, step, loading, error]);

  // Auto-find matches when profile is loaded and we're on summary step
  useEffect(() => {
    if (profile && step === 'summary') {
      console.log('Auto-finding matches for profile:', profile.id);
      findMatches();
    }
  }, [profile, step, findMatches]);

  // Update matches when filtered matches change
  useEffect(() => {
    if (filteredMatches.length > 0) {
      console.log(`Found ${filteredMatches.length} matching jobs`);
    }
  }, [filteredMatches]);

  const handleUpload = async (file: File) => {
    console.log('Uploading file:', file.name);
    try {
      await uploadProfile(file);
      console.log('Upload successful');
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  const handleContinue = () => {
    console.log('Moving to recommendations step');
    moveToStep('recommendations');
  };

  const handleViewDetails = (match: MatchingResult) => {
    setSnackbarMessage(`Viewing details for ${match.job.title} at ${match.job.company_name}`);
    setSnackbarOpen(true);
  };

  const handleSkillAnalysis = (match: MatchingResult) => {
    console.log('Viewing skill analysis for:', match.job.title);
    setSelectedMatch(match);
    moveToStep('analysis');
  };

  const handleBackToJobs = () => {
    console.log('Returning to job recommendations');
    moveToStep('recommendations');
  };

  const handleViewJobDetails = () => {
    if (selectedMatch) {
      setSnackbarMessage(`Opening job details for ${selectedMatch.job.title}`);
      setSnackbarOpen(true);
    }
  };

  const handleCloseSkillGapsModal = () => {
    setShowSkillGapsModal(false);
    setSelectedMatch(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const getSkillGaps = () => {
    if (!profile || !selectedMatch) return [];
    return jobMatchingEngine.getSkillGaps(profile, selectedMatch.job);
  };

  // Render role recommendations from backend
  const renderRoleRecommendations = () => {
    if (!profile?.analysisData?.top_roles || profile.analysisData.top_roles.length === 0) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No role recommendations available
          </Typography>
        </Paper>
      );
    }

    const topRoles = profile.analysisData.top_roles;

    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Career Role Recommendations
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Based on your resume analysis, here are the top {topRoles.length} career roles that match your profile
        </Typography>

        <Stack spacing={3} sx={{ mt: 4 }}>
          {topRoles.map((role, index) => {
            const scorePercentage = Math.round(role.overall_score * 100);
            const getScoreColor = (score: number) => {
              if (score >= 0.7) return 'success';
              if (score >= 0.5) return 'warning';
              return 'error';
            };

            return (
              <Paper key={role.role_id} sx={{ p: 3, border: index === 0 ? 2 : 1, borderColor: index === 0 ? 'primary.main' : 'divider' }}>
                <Grid container spacing={2}>
                  {/* Rank Badge */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Chip
                        label={`#${index + 1}`}
                        color={index === 0 ? 'primary' : 'default'}
                        size="small"
                      />
                      {index === 0 && (
                        <Chip
                          label="Best Match"
                          color="success"
                          size="small"
                          icon={<CheckCircleIcon />}
                        />
                      )}
                    </Box>
                  </Grid>

                  {/* Role Title and Category */}
                  <Grid item xs={12} md={8}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      {role.role_title}
                    </Typography>
                    <Chip
                      label={role.role_category}
                      size="small"
                      icon={<WorkIcon />}
                      sx={{ mb: 2 }}
                    />
                  </Grid>

                  {/* Overall Score */}
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                      <Typography variant="h3" fontWeight="bold" color={`${getScoreColor(role.overall_score)}.main`}>
                        {scorePercentage}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Overall Match
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Detailed Scores */}
                  <Grid item xs={12}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Skills</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={role.skills_score * 100}
                            color={getScoreColor(role.skills_score)}
                            sx={{ height: 8, borderRadius: 1, mt: 0.5 }}
                          />
                          <Typography variant="caption" fontWeight="bold">
                            {Math.round(role.skills_score * 100)}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Education</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={role.education_score * 100}
                            color={getScoreColor(role.education_score)}
                            sx={{ height: 8, borderRadius: 1, mt: 0.5 }}
                          />
                          <Typography variant="caption" fontWeight="bold">
                            {Math.round(role.education_score * 100)}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Certifications</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={role.certification_score * 100}
                            color={getScoreColor(role.certification_score)}
                            sx={{ height: 8, borderRadius: 1, mt: 0.5 }}
                          />
                          <Typography variant="caption" fontWeight="bold">
                            {Math.round(role.certification_score * 100)}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Experience</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={role.experience_score * 100}
                            color={getScoreColor(role.experience_score)}
                            sx={{ height: 8, borderRadius: 1, mt: 0.5 }}
                          />
                          <Typography variant="caption" fontWeight="bold">
                            {Math.round(role.experience_score * 100)}%
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Matched Skills */}
                  {role.matched_skills && role.matched_skills.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon color="success" fontSize="small" />
                        Matched Skills ({role.matched_skills.length})
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {role.matched_skills.map((skill, idx) => (
                          <Chip
                            key={idx}
                            label={skill}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Grid>
                  )}

                  {/* Missing Skills / Skill Gaps */}
                  {role.missing_skills && role.missing_skills.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon color="warning" fontSize="small" />
                        Skills to Develop ({role.missing_skills.length})
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {role.missing_skills.slice(0, 10).map((skill, idx) => (
                          <Chip
                            key={idx}
                            label={skill}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Grid>
                  )}

                  {/* Recommendations */}
                  {role.recommendations && role.recommendations.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUpIcon color="primary" fontSize="small" />
                        Growth Recommendations
                      </Typography>
                      <Stack spacing={1}>
                        {role.recommendations.map((rec, idx) => (
                          <Paper key={idx} sx={{ p: 1.5, bgcolor: 'primary.50' }}>
                            <Typography variant="body2">{rec}</Typography>
                          </Paper>
                        ))}
                      </Stack>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            );
          })}
        </Stack>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
          <Button variant="outlined" onClick={reset}>
            Analyze Another Resume
          </Button>
          <Button variant="contained" onClick={handleContinue}>
            Find Matching Jobs
          </Button>
        </Box>
      </Container>
    );
  };

  const renderCurrentStep = () => {
    console.log('Rendering step:', step);

    switch (step) {
      case 'upload':
        return (
          <UploadView
            onUpload={handleUpload}
            loading={loading}
            error={error}
          />
        );

      case 'summary':
        if (!profile) {
          console.warn('No profile data available for summary view');
          return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Alert severity="warning">
                Profile data is not available. Please upload your resume again.
              </Alert>
            </Box>
          );
        }
        return (
          <>
            <ProfileSummaryView
              profile={profile}
              onContinue={() => moveToStep('roleRecommendations')}
              onReset={reset}
            />
          </>
        );

      case 'roleRecommendations':
        return renderRoleRecommendations();

      case 'recommendations':
        return (
          <JobRecommendationsView
            matches={filteredMatches}
            loading={matchingLoading}
            onViewDetails={handleViewDetails}
            onViewSkillGaps={handleSkillAnalysis}
          />
        );

      case 'analysis':
        return selectedMatch ? (
          <SkillAnalysisView
            profile={profile!}
            selectedMatch={selectedMatch}
            onBack={handleBackToJobs}
            onViewJobDetails={handleViewJobDetails}
          />
        ) : (
          <JobRecommendationsView
            matches={filteredMatches}
            loading={matchingLoading}
            onViewDetails={handleViewDetails}
            onViewSkillGaps={handleSkillAnalysis}
          />
        );

      default:
        console.warn('Unknown step:', step);
        return (
          <UploadView
            onUpload={handleUpload}
            loading={loading}
            error={error}
          />
        );
    }
  };

  return (
    <Box>
      {/* Display global error if any */}
      {error && step !== 'upload' && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error" onClose={() => reset()}>
            {error}
          </Alert>
        </Box>
      )}

      {renderCurrentStep()}

      {/* Skill Gaps Modal */}
      {selectedMatch && (
        <MissingSkillsModal
          open={showSkillGapsModal}
          onClose={handleCloseSkillGapsModal}
          skillGaps={getSkillGaps()}
          jobTitle={selectedMatch.job.title}
          companyName={selectedMatch.job.company_name}
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="info" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
