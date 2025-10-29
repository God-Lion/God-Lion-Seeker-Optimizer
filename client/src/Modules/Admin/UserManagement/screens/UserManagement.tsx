import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  IconButton,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Block,
  CheckCircle,
  Delete,
  Edit,
  VpnKey,
  Security,
  NavigateNext,
  Dashboard as DashboardIcon,
  People,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

export const UserManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: string;
    user: any | null;
  }>({ open: false, action: '', user: null });

  // Mock data - replace with actual hook
  const usersData = {
    totalUsers: 150,
    users: [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        status: 'active',
        avatar: '',
        registeredAt: new Date(),
        lastActive: new Date(),
        jobsScraped: 45,
      },
    ],
  };

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, user: any) => {
    setSelectedUser(user);
    setActionMenuAnchor(event.currentTarget);
  };

  const handleActionClose = () => {
    setActionMenuAnchor(null);
  };

  const handleConfirmAction = async () => {
    // Implementation here
    setConfirmDialog({ open: false, action: '', user: null });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'user':
        return 'primary';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'user',
      headerName: 'User',
      width: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar src={params.row.avatar} sx={{ width: 32, height: 32 }}>
            {params.row.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {params.row.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color={getRoleColor(params.value) as any}
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color={getStatusColor(params.value) as any}
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'registeredAt',
      headerName: 'Registered',
      width: 150,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'lastActive',
      headerName: 'Last Active',
      width: 150,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'jobsScraped',
      headerName: 'Jobs Scraped',
      width: 120,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton
          size="small"
          onClick={(e) => handleActionClick(e, params.row)}
        >
          <MoreVert />
        </IconButton>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 2 }}
        >
          <Link
            underline="hover"
            color="inherit"
            href="/admin"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <DashboardIcon sx={{ mr: 0.5 }} fontSize="small" />
            Admin
          </Link>
          <Typography color="text.primary">User Management</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              User Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage user accounts, roles, and permissions
            </Typography>
          </Box>
          <Chip
            icon={<People />}
            label={`${usersData?.totalUsers || 0} Total Users`}
            color="primary"
            variant="outlined"
          />
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search users by name or email..."
            variant="outlined"
            size="small"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            sx={{ minWidth: 120 }}
          >
            Filter
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={usersData?.users || []}
          columns={columns}
          loading={false}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
          }}
        />
      </Paper>

      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionClose}
      >
        <MenuItem onClick={handleActionClose}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          setConfirmDialog({
            open: true,
            action: selectedUser?.status === 'active' ? 'suspend' : 'activate',
            user: selectedUser,
          });
          handleActionClose();
        }}>
          {selectedUser?.status === 'active' ? (
            <>
              <Block sx={{ mr: 1 }} fontSize="small" />
              Suspend User
            </>
          ) : (
            <>
              <CheckCircle sx={{ mr: 1 }} fontSize="small" />
              Activate User
            </>
          )}
        </MenuItem>
        <MenuItem onClick={() => {
          setConfirmDialog({
            open: true,
            action: 'reset-password',
            user: selectedUser,
          });
          handleActionClose();
        }}>
          <VpnKey sx={{ mr: 1 }} fontSize="small" />
          Reset Password
        </MenuItem>
        <MenuItem onClick={handleActionClose}>
          <Security sx={{ mr: 1 }} fontSize="small" />
          View Security Logs
        </MenuItem>
        <MenuItem
          onClick={() => {
            setConfirmDialog({
              open: true,
              action: 'delete',
              user: selectedUser,
            });
            handleActionClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete User
        </MenuItem>
      </Menu>

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: '', user: null })}
      >
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {confirmDialog.action === 'delete' && 'This action cannot be undone.'}
            {confirmDialog.action === 'suspend' && 'User will not be able to access their account.'}
            {confirmDialog.action === 'activate' && 'User will regain access to their account.'}
            {confirmDialog.action === 'reset-password' && 'A password reset email will be sent.'}
          </Alert>
          <Typography>
            Are you sure you want to {confirmDialog.action} user{' '}
            <strong>{confirmDialog.user?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, action: '', user: null })}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            color={confirmDialog.action === 'delete' ? 'error' : 'primary'}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;
