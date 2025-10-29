import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import { MatchingResult } from '../types';
import { FitScoreIndicator } from './FitScoreIndicator';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';

interface JobMatchCardProps {
  match: MatchingResult;
  onViewDetails?: () => void;
  onViewSkillGaps?: () => void;
}

export const JobMatchCard: React.FC<JobMatchCardProps> = ({
  match,
  onViewDetails,
  onViewSkillGaps,
}) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header with Score */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              {match.job.title}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {match.job.company_name}
            </Typography>
          </Box>
          <Box sx={{ minWidth: 100, display: 'flex', justifyContent: 'center' }}>
            <FitScoreIndicator score={match.fitScore} size="small" showLabel={false} />
          </Box>
        </Box>

        {/* Location & Experience Level */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip
            icon={<LocationOnIcon />}
            label={match.job.location}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<WorkIcon />}
            label={match.job.experience_level}
            size="small"
            variant="outlined"
          />
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        {/* Matched Skills */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" fontWeight="bold" color="success.main">
            ✓ Matched Skills ({match.matchedSkills.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
            {match.matchedSkills.slice(0, 4).map((skill, idx) => (
              <Chip key={idx} label={skill} size="small" color="success" variant="outlined" />
            ))}
            {match.matchedSkills.length > 4 && (
              <Chip label={`+${match.matchedSkills.length - 4}`} size="small" />
            )}
          </Box>
        </Box>

        {/* Missing Skills */}
        {match.missingSkills.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" fontWeight="bold" color="warning.main">
              ⚠ Missing Skills ({match.missingSkills.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
              {match.missingSkills.slice(0, 3).map((skill, idx) => (
                <Chip key={idx} label={skill} size="small" color="warning" variant="outlined" />
              ))}
              {match.missingSkills.length > 3 && (
                <Chip label={`+${match.missingSkills.length - 3}`} size="small" />
              )}
            </Box>
          </Box>
        )}
      </CardContent>

      <Divider />

      {/* Action Buttons */}
      <Box sx={{ p: 1.5, display: 'flex', gap: 1 }}>
        <Button size="small" variant="outlined" onClick={onViewDetails} fullWidth>
          View Details
        </Button>
        <Button size="small" variant="contained" onClick={onViewSkillGaps} fullWidth>
          Skill Gaps
        </Button>
      </Box>
    </Card>
  );
};
