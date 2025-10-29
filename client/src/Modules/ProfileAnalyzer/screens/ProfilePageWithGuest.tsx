/**
 * Enhanced Profile Analyzer Page with Guest Mode Support
 * 
 * This page includes:
 * - Guest mode indicator
 * - Session-based storage for guests
 * - "Sign up to save" prompts
 * - Data persistence warnings
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Alert,
  Snackbar,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Stack,
  LinearProgress,
} from '@mui/material'
import { useProfileAnalyzer } from '../hooks/useProfileAnalyzer'
import { useJobMatching } from '../hooks/useJobMatching'
import { UploadView } from '../views/UploadView'
import { ProfileSummaryView } from '../views/ProfileSummaryView'
import { JobRecommendationsView } from '../views/JobRecommendationsView'
import { SkillAnalysisView } from '../views/SkillAnalysisView'
import { MissingSkillsModal } from '../components/MissingSkillsModal'
import { jobMatchingEngine } from '../services/matchingEngine'
import { MatchingResult } from '../types'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import WorkIcon from '@mui/icons-material/Work'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import { GuestBanner, FeatureLockedModal } from 'src/components/common'
import { useGuest } from 'src/store'

export const ProfilePage: React.FC = () => {
  const { isGuest, analysisCounts, incrementAnalysisCount } = useGuest()

  const {
    profile,
    loading,
    error,
    step,
    uploadProfile,
    moveToStep,
    reset,
  } = useProfileAnalyzer()

  const {
    matches: filteredMatches,
    loading: matchingLoading,
    findMatches,
  } = useJobMatching(profile)

  const [selectedMatch, setSelectedMatch] = useState<MatchingResult | null>(null)
  const [showSkillGapsModal, setShowSkillGapsModal] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [showFeatureLocked, setShowFeatureLocked] = useState(false)
  const [lockedFeature, setLockedFeature] = useState({ name: '', description: '' })

  // Guest mode: Limit to 1 analysis per session
  const GUEST_ANALYSIS_LIMIT = 1

  // Debug logging
  useEffect(() => {
    console.log('=== ProfilePage State ===')
    console.log('Current step:', step)
    console.log('Is Guest:', isGuest)
    console.log('Analysis count:', analysisCounts)
    console.log('========================')
  }, [step, isGuest, analysisCounts])

  // Auto-find matches when profile is loaded
  useEffect(() => {
    if (profile && step === 'summary') {
      findMatches()
    }
  }, [profile, step, findMatches])

  const handleUpload = async (file: File) => {
    // Check if guest user has exceeded limit
    if (isGuest && analysisCounts >= GUEST_ANALYSIS_LIMIT) {
      setLockedFeature({
        name: 'Additional Profile Analysis',
        description: 'Guest users are limited to 1 profile analysis per session. Sign up to analyze unlimited resumes and save your results!',
      })
      setShowFeatureLocked(true)
      return
    }

    try {
      await uploadProfile(file)
      
      // Increment guest analysis count if guest
      if (isGuest) {
        incrementAnalysisCount()
      }
    } catch (err) {
      console.error('Upload error:', err)
    }
  }

  const handleContinue = () => {
    moveToStep('recommendations')
  }

  const handleViewDetails = (match: MatchingResult) => {
    setSnackbarMessage(`Viewing details for ${match.job.title} at ${match.job.company_name}`)
    setSnackbarOpen(true)
  }

  const handleSkillAnalysis = (match: MatchingResult) => {
    setSelectedMatch(match)
    moveToStep('analysis')
  }

  const handleBackToJobs = () => {
    moveToStep('recommendations')
  }

  const handleViewJobDetails = () => {
    if (selectedMatch) {
      setSnackbarMessage(`Opening job details for ${selectedMatch.job.title}`)
      setSnackbarOpen(true)
    }
  }

  const getSkillGaps = () => {
    if (!profile || !selectedMatch) return []
    return jobMatchingEngine.getSkillGaps(profile, selectedMatch.job)
  }

  // Show "Sign up to save" prompt for guests
  const renderGuestSavePrompt = () => {
    if (!isGuest || step !== 'summary') return null

    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          <strong>Your analysis will be lost when you close this tab!</strong>
        </Typography>
        <Typography variant="body2">
          Sign up to save your resume analysis and get personalized job recommendations.
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button 
            size="small" 
            variant="contained" 
            onClick={() => {
              setLockedFeature({
                name: 'Save Analysis',
                description: 'Create an account to save your resume analysis, track multiple profiles, and get unlimited career insights.',
              })
              setShowFeatureLocked(true)
            }}
          >
            Save My Analysis
          </Button>
        </Box>
      </Alert>
    )
  }

  // Render role recommendations
  const renderRoleRecommendations = () => {
    if (!profile?.analysisData?.top_roles || profile.analysisData.top_roles.length === 0) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No role recommendations available</Typography>
        </Paper>
      )
    }

    const topRoles = profile.analysisData.top_roles

    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Guest Banner */}
        {isGuest && <GuestBanner variant="minimal" />}
        
        {/* Guest Save Prompt */}
        {renderGuestSavePrompt()}

        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Career Role Recommendations
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Based on your resume analysis, here are the top {topRoles.length} career roles that match your profile
        </Typography>

        <Stack spacing={3} sx={{ mt: 4 }}>
          {topRoles.map((role, index) => {
            const scorePercentage = Math.round(role.overall_score * 100)
            const getScoreColor = (score: number) => {
              if (score >= 0.7) return 'success'
              if (score >= 0.5) return 'warning'
              return 'error'
            }

            return (
              <Paper
                key={role.role_id}
                sx={{ p: 3, border: index === 0 ? 2 : 1, borderColor: index === 0 ? 'primary.main' : 'divider' }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Chip label={`#${index + 1}`} color={index === 0 ? 'primary' : 'default'} size="small" />
                      {index === 0 && <Chip label="Best Match" color="success" size="small" icon={<CheckCircleIcon />} />}
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={8}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      {role.role_title}
                    </Typography>
                    <Chip label={role.role_category} size="small" icon={<WorkIcon />} sx={{ mb: 2 }} />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                      <Typography variant="h3" fontWeight="bold" color={`${getScoreColor(role.overall_score)}.main`}>
                        {scorePercentage}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Overall Match</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Grid container spacing={2}>
                      {[
                        { label: 'Skills', score: role.skills_score },
                        { label: 'Education', score: role.education_score },
                        { label: 'Certifications', score: role.certification_score },
                        { label: 'Experience', score: role.experience_score },
                      ].map((item) => (
                        <Grid item xs={6} sm={3} key={item.label}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                            <LinearProgress
                              variant="determinate"
                              value={item.score * 100}
                              color={getScoreColor(item.score)}
                              sx={{ height: 8, borderRadius: 1, mt: 0.5 }}
                            />
                            <Typography variant="caption" fontWeight="bold">
                              {Math.round(item.score * 100)}%
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>

                  {role.matched_skills && role.matched_skills.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon color="success" fontSize="small" />
                        Matched Skills ({role.matched_skills.length})
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {role.matched_skills.map((skill, idx) => (
                          <Chip key={idx} label={skill} size="small" color="success" variant="outlined" />
                        ))}
                      </Box>
                    </Grid>
                  )}

                  {role.missing_skills && role.missing_skills.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon color="warning" fontSize="small" />
                        Skills to Develop ({role.missing_skills.length})
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {role.missing_skills.slice(0, 10).map((skill, idx) => (
                          <Chip key={idx} label={skill} size="small" color="warning" variant="outlined" />
                        ))}
                      </Box>
                    </Grid>
                  )}

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
            )
          })}
        </Stack>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
          <Button variant="outlined" onClick={reset}>
            Analyze Another Resume
          </Button>
          <Button variant="contained" onClick={handleContinue}>
            Find Matching Jobs
          </Button>
        </Box>
      </Container>
    )
  }

  const renderCurrentStep = () => {
    switch (step) {
      case 'upload':
        return (
          <>
            {isGuest && (
              <Box sx={{ mb: 3 }}>
                <GuestBanner variant="detailed" />
                {analysisCounts > 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    You have used {analysisCounts} of {GUEST_ANALYSIS_LIMIT} free profile analysis. 
                    Sign up for unlimited access!
                  </Alert>
                )}
              </Box>
            )}
            <UploadView onUpload={handleUpload} loading={loading} error={error} />
          </>
        )

      case 'summary':
        if (!profile) {
          return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Alert severity="warning">
                Profile data is not available. Please upload your resume again.
              </Alert>
            </Box>
          )
        }
        return (
          <>
            {isGuest && <GuestBanner variant="minimal" />}
            {renderGuestSavePrompt()}
            <ProfileSummaryView
              profile={profile}
              onContinue={() => moveToStep('roleRecommendations')}
              onReset={reset}
            />
          </>
        )

      case 'roleRecommendations':
        return renderRoleRecommendations()

      case 'recommendations':
        return (
          <>
            {isGuest && <GuestBanner variant="minimal" />}
            <JobRecommendationsView
              matches={filteredMatches}
              loading={matchingLoading}
              onViewDetails={handleViewDetails}
              onViewSkillGaps={handleSkillAnalysis}
            />
          </>
        )

      case 'analysis':
        return selectedMatch ? (
          <>
            {isGuest && <GuestBanner variant="minimal" />}
            <SkillAnalysisView
              profile={profile!}
              selectedMatch={selectedMatch}
              onBack={handleBackToJobs}
              onViewJobDetails={handleViewJobDetails}
            />
          </>
        ) : (
          <JobRecommendationsView
            matches={filteredMatches}
            loading={matchingLoading}
            onViewDetails={handleViewDetails}
            onViewSkillGaps={handleSkillAnalysis}
          />
        )

      default:
        return <UploadView onUpload={handleUpload} loading={loading} error={error} />
    }
  }

  return (
    <Box>
      {error && step !== 'upload' && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error" onClose={() => reset()}>
            {error}
          </Alert>
        </Box>
      )}

      {renderCurrentStep()}

      <MissingSkillsModal
        open={showSkillGapsModal}
        onClose={() => setShowSkillGapsModal(false)}
        skillGaps={getSkillGaps()}
        jobTitle={selectedMatch?.job.title || ''}
        companyName={selectedMatch?.job.company_name || ''}
      />

      <FeatureLockedModal
        open={showFeatureLocked}
        onClose={() => setShowFeatureLocked(false)}
        featureName={lockedFeature.name}
        featureDescription={lockedFeature.description}
        benefits={[
          'Unlimited profile analysis',
          'Save and manage multiple resumes',
          'Get personalized job recommendations',
          'Track your applications',
          'Export your analysis anytime',
          'Access to all premium features',
        ]}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="info" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ProfilePage
