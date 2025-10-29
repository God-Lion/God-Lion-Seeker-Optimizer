import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
} from '@mui/material';
import { SkillGap } from '../types';
import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LinkIcon from '@mui/icons-material/Link';

interface MissingSkillsModalProps {
  open: boolean;
  onClose: () => void;
  skillGaps: SkillGap[];
  jobTitle: string;
  companyName: string;
}

export const MissingSkillsModal: React.FC<MissingSkillsModalProps> = ({
  open,
  onClose,
  skillGaps,
  jobTitle,
  companyName,
}) => {
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

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'critical':
        return '🔴';
      case 'important':
        return '🟡';
      case 'nice-to-have':
        return '🔵';
      default:
        return '⚪';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight="bold">
          Missing Skills Analysis
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {jobTitle} at {companyName}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {skillGaps.length === 0 ? (
          <Alert severity="success">
            Congratulations! You have all the required skills for this position.
          </Alert>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Here are the skills you need to develop to improve your fit for this role:
            </Typography>

            <List>
              {skillGaps.map((gap, index) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Typography variant="h6">
                        {getImportanceIcon(gap.importance)}
                      </Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {gap.skill}
                          </Typography>
                          <Chip
                            label={gap.importance}
                            size="small"
                            color={getImportanceColor(gap.importance) as any}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <AccessTimeIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              Estimated learning time: {gap.estimatedLearningHours} hours
                            </Typography>
                          </Box>
                          
                          {gap.resources && gap.resources.length > 0 && (
                            <Box>
                              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                                Learning Resources:
                              </Typography>
                              <List dense sx={{ py: 0 }}>
                                {gap.resources.map((resource, resIndex) => (
                                  <ListItem key={resIndex} sx={{ py: 0, px: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 20 }}>
                                      <LinkIcon fontSize="small" color="action" />
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={
                                        <Typography variant="body2" color="primary">
                                          {resource}
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

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Tip:</strong> Focus on critical skills first, then move to important ones. 
                Consider taking online courses or working on personal projects to develop these skills.
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button onClick={onClose} variant="contained">
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
};
