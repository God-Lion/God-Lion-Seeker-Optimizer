import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Avatar,
} from '@mui/material';
import {
  SettingsOutlined,
  DescriptionOutlined,
  EmailOutlined,
  AutoAwesomeOutlined,
  SearchOutlined,
} from '@mui/icons-material';

interface AutomationTaskProps {
  icon: React.ReactElement;
  title: string;
  description: string;
  isActive: boolean;
  onToggle: () => void;
}

const AutomationTaskCard: React.FC<AutomationTaskProps> = ({
  icon,
  title,
  description,
  isActive,
  onToggle,
}) => (
  <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Avatar sx={{ bgcolor: 'rgba(212, 175, 55, 0.1)', color: 'primary.main' }}>
          {icon}
        </Avatar>
        <FormControlLabel
          control={<Switch checked={isActive} onChange={onToggle} color="primary" />}
          label={isActive ? 'Active' : 'Inactive'}
          labelPlacement="start"
        />
      </Box>
      <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {description}
      </Typography>
      <Button
        variant="contained"
        startIcon={<SettingsOutlined />}
        sx={{
          backgroundColor: '#F5F5F5',
          color: 'text.primary',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#E0E0E0',
          },
        }}
      >
        Configure
      </Button>
    </CardContent>
  </Card>
);

const AutomationHub: React.FC = () => {
  const [tasks, setTasks] = useState({
    autoFill: true,
    followUps: false,
    tailoring: true,
    discovery: false,
  });

  const handleToggle = (task: keyof typeof tasks) => {
    setTasks((prev) => ({ ...prev, [task]: !prev[task] }));
  };

  const taskData = [
    {
      id: 'autoFill',
      icon: <DescriptionOutlined />,
      title: 'Auto-Fill Applications',
      description: 'Manage the automatic filling of online job application forms based on your profile.',
      isActive: tasks.autoFill,
    },
    {
      id: 'followUps',
      icon: <EmailOutlined />,
      title: 'Automated Follow-ups',
      description: 'Set up rules for sending automated follow-up emails after an application or interview.',
      isActive: tasks.followUps,
    },
    {
      id: 'tailoring',
      icon: <AutoAwesomeOutlined />,
      title: 'Resume/Cover Letter Tailoring',
      description: 'Configure AI-powered suggestions for tailoring application documents to specific job descriptions.',
      isActive: tasks.tailoring,
    },
    {
      id: 'discovery',
      icon: <SearchOutlined />,
      title: 'Job Discovery Agent',
      description: 'Set up automated searches for new jobs based on your defined criteria and get notified.',
      isActive: tasks.discovery,
    },
  ];


  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Automation Hub
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Configure and activate automated tasks to streamline your job application process.
          </Typography>
        </Box>
        <Button variant="contained" color="primary" size="large" sx={{ borderRadius: 2 }}>
          Save Changes
        </Button>
      </Box>
      <Grid container spacing={4}>
        {taskData.map((task) => (
          <Grid item xs={12} md={6} key={task.id}>
            <AutomationTaskCard
              icon={task.icon}
              title={task.title}
              description={task.description}
              isActive={task.isActive}
              onToggle={() => handleToggle(task.id as keyof typeof tasks)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AutomationHub;
