import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Chip,
  Alert,
  Breadcrumbs,
  Link,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Security,
  Download,
  Refresh,
  FilterList,
  NavigateNext,
  Dashboard as DashboardIcon,
  Warning,
  Error as ErrorIcon,
  Info,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

export const SecurityLogs: React.FC = () => {
  const [logType, setLogType] = useState('all');
  const [dateRange, setDateRange] = useState('7days');

  const securityLogs = [
    {
      id: 1,
      timestamp: new Date(),
      type: 'failed_login',
      severity: 'warning',
      user: 'john@example.com',
      ipAddress: '192.168.1.1',
      location: 'New York, US',
      details: 'Failed login attempt - incorrect password',
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 3600000),
      type: 'suspicious_activity',
      severity: 'error',
      user: 'suspicious@example.com',
      ipAddress: '10.0.0.1',
      location: 'Unknown',
      details: 'Multiple failed login attempts from same IP',
    },
  ];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      default:
        return <Info color="info" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      width: 180,
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
    {
      field: 'severity',
      headerName: 'Severity',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getSeverityIcon(params.value)}
          <Chip
            label={params.value}
            size="small"
            color={getSeverityColor(params.value) as any}
          />
        </Box>
      ),
    },
    { field: 'type', headerName: 'Event Type', width: 150 },
    { field: 'user', headerName: 'User', width: 200 },
    { field: 'ipAddress', headerName: 'IP Address', width: 130 },
    { field: 'location', headerName: 'Location', width: 150 },
    { field: 'details', headerName: 'Details', width: 300, flex: 1 },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
          <Link underline="hover" color="inherit" href="/admin">
            <DashboardIcon sx={{ mr: 0.5 }} fontSize="small" />
            Admin
          </Link>
          <Typography color="text.primary">Security Logs</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Security Logs
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor security events and suspicious activities
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button startIcon={<Refresh />} variant="outlined">
              Refresh
            </Button>
            <Button startIcon={<Download />} variant="contained">
              Export Logs
            </Button>
          </Box>
        </Box>
      </Box>

      <Alert severity="warning" sx={{ mb: 3 }} icon={<Security />}>
        {securityLogs.filter((log) => log.severity === 'error').length} critical security events
        detected in the last 24 hours
      </Alert>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Log Type</InputLabel>
            <Select value={logType} onChange={(e) => setLogType(e.target.value)} label="Log Type">
              <MenuItem value="all">All Events</MenuItem>
              <MenuItem value="failed_login">Failed Logins</MenuItem>
              <MenuItem value="suspicious_activity">Suspicious Activity</MenuItem>
              <MenuItem value="unauthorized_access">Unauthorized Access</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              label="Date Range"
            >
              <MenuItem value="24hours">Last 24 Hours</MenuItem>
              <MenuItem value="7days">Last 7 Days</MenuItem>
              <MenuItem value="30days">Last 30 Days</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </Select>
          </FormControl>

          <TextField
            placeholder="Search by user or IP..."
            variant="outlined"
            size="small"
            sx={{ flexGrow: 1 }}
          />

          <Button variant="outlined" startIcon={<FilterList />}>
            Advanced Filters
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={securityLogs}
          columns={columns}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        />
      </Paper>
    </Container>
  );
};

export default SecurityLogs;
