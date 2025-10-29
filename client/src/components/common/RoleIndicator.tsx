/**
 * Role Indicator Component
 * 
 * Visual indicator showing the current user's role (Guest, User, Admin)
 * Appears in the header/navbar area
 */

import React from 'react'
import { Chip, Tooltip, Box } from '@mui/material'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import PersonIcon from '@mui/icons-material/Person'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { useAuth, useGuest } from 'src/store'

interface RoleIndicatorProps {
  showLabel?: boolean
  size?: 'small' | 'medium'
}

/**
 * Role Indicator Component
 * 
 * Displays a colored chip indicating the user's current role
 */
export const RoleIndicator: React.FC<RoleIndicatorProps> = ({
  showLabel = true,
  size = 'small',
}) => {
  const { isAuthenticated, user } = useAuth()
  const { isGuest } = useGuest()

  // Determine role
  const getRole = () => {
    if (isAuthenticated && user) {
      // Check if admin (you'll need to adjust this based on your user object structure)
      const isAdmin = user.role === 'admin' || user.isAdmin
      if (isAdmin) {
        return {
          label: 'Admin',
          color: 'error' as const,
          icon: <AdminPanelSettingsIcon />,
          tooltip: 'Administrator Access',
        }
      }
      return {
        label: 'User',
        color: 'success' as const,
        icon: <PersonIcon />,
        tooltip: 'Registered User',
      }
    }

    if (isGuest) {
      return {
        label: 'Guest',
        color: 'warning' as const,
        icon: <PersonOffIcon />,
        tooltip: 'Guest Mode - Limited Access',
      }
    }

    return {
      label: 'Guest',
      color: 'default' as const,
      icon: <PersonOffIcon />,
      tooltip: 'Not Authenticated',
    }
  }

  const role = getRole()

  return (
    <Tooltip title={role.tooltip} arrow>
      <Box sx={{ display: 'inline-flex' }}>
        <Chip
          icon={role.icon}
          label={showLabel ? role.label : undefined}
          color={role.color}
          size={size}
          variant="outlined"
          sx={{
            fontWeight: 'bold',
            cursor: 'default',
          }}
        />
      </Box>
    </Tooltip>
  )
}

export default RoleIndicator
