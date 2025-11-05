import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Stepper,
  Step,
  StepLabel,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  MenuItem,
  CircularProgress,
  Stack,
} from '@mui/material';
import { MatchingResult } from '../types';
import { JobMatchCard } from '../components/JobMatchCard';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';

interface JobRecommendationsViewProps {
  matches: MatchingResult[];
  loading?: boolean;
  onViewDetails?: (match: MatchingResult) => void;
  onViewSkillGaps?: (match: MatchingResult) => void;
}

export const JobRecommendationsView: React.FC<JobRecommendationsViewProps> = ({
  matches,
  loading = false,
  onViewDetails,
  onViewSkillGaps,
}) => {
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [minFitScore, setMinFitScore] = useState(50);
  const [sortBy, setSortBy] = useState<'fitScore' | 'company' | 'role'>('fitScore');

  const filteredMatches = matches
    .filter(m => m.fitScore >= minFitScore)
    .sort((a, b) => {
      switch (sortBy) {
        case 'fitScore':
          return b.fitScore - a.fitScore;
        case 'company':
          return a.job.company_name.localeCompare(b.job.company_name);
        case 'role':
          return a.job.title.localeCompare(b.job.title);
        default:
          return 0;
      }
    });

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
          <StepLabel>View Recommendations</StepLabel>
        </Step>
      </Stepper>

      {/* Header & Filters */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            Job Recommendations ({filteredMatches.length})
          </Typography>
          <ToggleButtonGroup value={viewType} exclusive onChange={(_, newView) => newView && setViewType(newView)}>
            <ToggleButton value="grid">
              <GridViewIcon />
            </ToggleButton>
            <ToggleButton value="list">
              <ViewListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Min Fit Score"
              type="number"
              value={minFitScore}
              onChange={e => setMinFitScore(Number(e.target.value))}
              inputProps={{ min: 0, max: 100 }}
              size="small"
            />
            <TextField
              select
              label="Sort By"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              size="small"
            >
              <MenuItem value="fitScore">Fit Score</MenuItem>
              <MenuItem value="company">Company</MenuItem>
              <MenuItem value="role">Role</MenuItem>
            </TextField>
          </Stack>
        </Paper>
      </Box>

      {/* Results */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredMatches.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No jobs match your criteria</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredMatches.map(match => (
            <Grid item xs={12} sm={viewType === 'grid' ? 6 : 12} md={viewType === 'grid' ? 4 : 12} key={match.jobId}>
              <JobMatchCard
                match={match}
                onViewDetails={() => onViewDetails?.(match)}
                onViewSkillGaps={() => onViewSkillGaps?.(match)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};
