import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, IconButton, Tooltip, CircularProgress } from '@mui/material'
import { LogoutOutlined } from '@mui/icons-material'
import { useLogout } from 'src/Modules/Auth/hooks/useAuthQuery'
import { useAuth } from 'src/store'
import { clearAllAppData } from 'src/utils/storage/StorageManager'

interface SignOutButtonProps {
  variant?: 'button' | 'icon'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  showText?: boolean
  onSignOutComplete?: () => void
}

/**
 * SignOut Button Component
 * 
 * Handles user logout with proper cleanup:
 * - Calls backend logout endpoint
 * - Clears authentication tokens
 * - Clears user data from storage
 * - Resets Zustand store
 * - Clears React Query cache
 * - Redirects to login page
 */
export const SignOutButton: React.FC<SignOutButtonProps> = ({
  variant = 'button',
  size = 'medium',
  fullWidth = false,
  showText = true,
  onSignOutComplete,
}) => {
  const navigate = useNavigate()
  const { signOut: zustandSignOut } = useAuth()

  const { mutate: logout, isPending } = useLogout({
    onSuccess: () => {
      console.log('[SignOut] Logout successful')
      
      // Clear Zustand store
      zustandSignOut()
      
      // Clear all app data from storage
      clearAllAppData()
      
      // Call custom callback if provided
      onSignOutComplete?.()
      
      // Redirect to login page
      navigate('/auth/signin', { replace: true })
    },
    onError: (error) => {
      console.error('[SignOut] Logout error:', error)
      
      // Even if API call fails, clear local data and redirect
      zustandSignOut()
      clearAllAppData()
      onSignOutComplete?.()
      navigate('/auth/signin', { replace: true })
    },
  })

  const handleSignOut = () => {
    console.log('[SignOut] Initiating logout...')
    logout()
  }

  if (variant === 'icon') {
    return (
      <Tooltip title="Sign Out">
        <IconButton
          onClick={handleSignOut}
          disabled={isPending}
          size={size}
          color="inherit"
          aria-label="sign out"
        >
          {isPending ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <LogoutOutlined />
          )}
        </IconButton>
      </Tooltip>
    )
  }

  return (
    <Button
      onClick={handleSignOut}
      disabled={isPending}
      size={size}
      fullWidth={fullWidth}
      variant="outlined"
      color="error"
      startIcon={isPending ? <CircularProgress size={16} /> : <LogoutOutlined />}
      aria-label="sign out"
    >
      {showText && (isPending ? 'Signing out...' : 'Sign Out')}
    </Button>
  )
}

export default SignOutButton
