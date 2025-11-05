import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  AppBar,
  Box,
  Button,
  Checkbox,
  Container,
  Drawer,
  IconButton,
  InputBase,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  Add,
  ArrowDropDown,
  Dashboard,
  Delete,
  Edit,
  Group,
  Logout,
  Notifications,
  PieChart,
  Search,
  Settings,
  UploadFile,
} from '@mui/icons-material';

const UserManagement: React.FC = () => {
  return (
    <React.Fragment>
      <Helmet>
        <title>User Management - LionTrack</title>
      </Helmet>
      <Box sx={{ display: 'flex' }}>
        <AppBar
          position='fixed'
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: 'white' }}
        >
          <Toolbar>
            <Typography variant='h6' noWrap component='div' sx={{ color: 'black' }}>
              Majestic lion and magnifying glass logo
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <InputBase
                placeholder='Search users…'
                startAdornment={<Search />}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  padding: '2px 8px',
                  marginRight: 2,
                }}
              />
              <IconButton>
                <Notifications />
              </IconButton>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundImage:
                    'url(https://lh3.googleusercontent.com/aida-public/AB6AXuAubBR9pS3ICC-tb2N78pWE-j3s3VXzFcEPy1HiV2elJxNGE2H9muCdyG86f0y7143rd3w7cGYWSnT--UW54Mrv_gOLFEombtOZqsmURy1jrEzLXN3oZhKaIicOCuqf13YiIF_csIvYI6hsEPyQ84klmRekWSnLvT53Fcxz5F5d2VgvsXBFIbrgm-NtNkDxl5MnQp1doq0rFp6ZT4o1MRn79Kbz0wy9jPfJfwQSq9tRLUTSbuKp11rw7xb7xw1UQPHC7hBaVYnLCVk)',
                  backgroundSize: 'cover',
                }}
              />
            </Box>
          </Toolbar>
        </AppBar>
        <Drawer
          variant='permanent'
          sx={{
            width: 240,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemIcon>
                    <Dashboard />
                  </ListItemIcon>
                  <ListItemText primary='Dashboard' />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton selected>
                  <ListItemIcon>
                    <Group />
                  </ListItemIcon>
                  <ListItemText primary='User Management' />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemIcon>
                    <Settings />
                  </ListItemIcon>
                  <ListItemText primary='System Settings' />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemIcon>
                    <PieChart />
                  </ListItemIcon>
                  <ListItemText primary='Analytics' />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Box>
            <List>
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemIcon>
                    <Logout />
                  </ListItemIcon>
                  <ListItemText primary='Logout' />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Drawer>
        <Box component='main' sx={{ flexGrow: 1, p: 3, backgroundColor: '#F9F9F9' }}>
          <Toolbar />
          <Container>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                User Management
              </Typography>
              <Box>
                <Button
                  variant='contained'
                  startIcon={<Add />}
                  sx={{ mr: 1, backgroundColor: '#D4AF37' }}
                >
                  Add New User
                </Button>
                <Button variant='outlined' startIcon={<UploadFile />}>
                  Export Users
                </Button>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Button endIcon={<ArrowDropDown />} sx={{ mr: 1 }}>
                  Role: All
                </Button>
                <Button endIcon={<ArrowDropDown />}>Status: All</Button>
              </Box>
              <Typography variant='body2' color='text.secondary'>
                Showing 1-10 of 124 users
              </Typography>
            </Box>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding='checkbox'>
                      <Checkbox />
                    </TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date Joined</TableCell>
                    <TableCell align='right'>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    {
                      name: 'Admin User',
                      email: 'admin@liontrack.com',
                      role: 'Admin',
                      status: 'Active',
                      date: '2023-01-15',
                    },
                    {
                      name: 'Jane Doe',
                      email: 'jane.doe@example.com',
                      role: 'User',
                      status: 'Active',
                      date: '2023-03-22',
                    },
                    {
                      name: 'John Smith',
                      email: 'john.smith@example.com',
                      role: 'User',
                      status: 'Inactive',
                      date: '2023-05-10',
                    },
                    {
                      name: 'Emily White',
                      email: 'emily.white@example.com',
                      role: 'User',
                      status: 'Active',
                      date: '2023-06-01',
                    },
                    {
                      name: 'Michael Brown',
                      email: 'michael.brown@example.com',
                      role: 'Admin',
                      status: 'Active',
                      date: '2023-07-11',
                    },
                  ].map((row) => (
                    <TableRow key={row.name}>
                      <TableCell padding='checkbox'>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>{row.name}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {row.email}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.role}</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell align='right'>
                        <IconButton>
                          <Edit />
                        </IconButton>
                        <IconButton>
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Container>
        </Box>
      </Box>
    </React.Fragment>
  );
};

export default UserManagement;
