import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Chip,
  Button,
  IconButton,
  Alert,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Flag,
  Work,
  Business,
  CheckCircle,
  Cancel,
  Delete,
  NavigateNext,
  Dashboard as DashboardIcon,
  Refresh,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>
);

export const ContentModeration: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const flaggedJobs = [
    {
      id: 1,
      title: 'Senior Developer',
      company: 'Tech Corp',
      reason: 'Suspicious salary range',
      reportedBy: 3,
      reportedAt: new Date(),
      status: 'pending',
    },
  ];

  const jobColumns: GridColDef[] = [
    { field: 'title', headerName: 'Job Title', width: 200 },
    { field: 'company', headerName: 'Company', width: 150 },
    { field: 'reason', headerName: 'Flag Reason', width: 200 },
    { field: 'reportedBy', headerName: 'Reports', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'pending' ? 'warning' : 'default'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: () => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" color="success">
            <CheckCircle />
          </IconButton>
          <IconButton size="small" color="error">
            <Cancel />
          </IconButton>
          <IconButton size="small">
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
          <Link underline="hover" color="inherit" href="/admin">
            <DashboardIcon sx={{ mr: 0.5 }} fontSize="small" />
            Admin
          </Link>
          <Typography color="text.primary">Content Moderation</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Content Moderation
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Review and moderate flagged content
            </Typography>
          </Box>
          <Button startIcon={<Refresh />} variant="outlined">
            Refresh Queue
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)}>
          <Tab icon={<Work />} label="Flagged Jobs" iconPosition="start" />
          <Tab icon={<Business />} label="Company Profiles" iconPosition="start" />
          <Tab icon={<Flag />} label="User Reports" iconPosition="start" />
        </Tabs>
      </Paper>

      <TabPanel value={currentTab} index={0}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Review flagged job listings for inappropriate content or suspicious information
        </Alert>
        <Paper sx={{ height: 600 }}>
          <DataGrid
            rows={flaggedJobs}
            columns={jobColumns}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
          />
        </Paper>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Review company profiles for accuracy and authenticity
        </Alert>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No pending company profiles to review</Typography>
        </Paper>
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Review user-reported content and take appropriate action
        </Alert>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No user reports pending</Typography>
        </Paper>
      </TabPanel>
    </Container>
  );
};

export default ContentModeration;
