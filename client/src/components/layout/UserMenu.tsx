import React, { useState } from 'react'
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Typography,
  Box,
} from '@mui/material'
import {
  AccountCircle,
  Settings,
  Dashboard,
  LogoutOutlined,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from 'src/store'
import { useSignOut } from 'src/Modules/Auth/hooks/useSignOut'


export const UserMenu: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { signOut, isSigningOut } = useSignOut({
    onSuccess: () => {
      console.log('Successfully signed out')
    },
  })

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    handleClose()
  }

  const handleSignOut = () => {
    handleClose()
    signOut()
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.full_name) return 'U'
    const names = user.full_name.split(' ')
    return names.length > 1
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0][0].toUpperCase()
  }

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        aria-controls={open ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        aria-label="user menu"
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'primary.main',
            fontSize: '0.875rem',
          }}
        >
          {getUserInitials()}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        id="user-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 220,
            mt: 1.5,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
            },
          },
        }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {user?.full_name || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email || ''}
          </Typography>
          {user?.role && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 0.5,
                px: 1,
                py: 0.25,
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                borderRadius: 1,
                width: 'fit-content',
                textTransform: 'capitalize',
              }}
            >
              {user.role}
            </Typography>
          )}
        </Box>

        <Divider />

        {/* Menu Items */}
        <MenuItem onClick={() => handleNavigate('/dashboard')}>
          <ListItemIcon>
            <Dashboard fontSize="small" />
          </ListItemIcon>
          <ListItemText>Dashboard</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleNavigate('/profile')}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleNavigate('/settings')}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>

        <Divider />

        {/* Sign Out */}
        <MenuItem
          onClick={handleSignOut}
          disabled={isSigningOut}
          sx={{
            color: 'error.main',
            '&:hover': {
              bgcolor: 'error.lighter',
            },
          }}
        >
          <ListItemIcon>
            <LogoutOutlined fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}

export default UserMenu
