import { useState, useEffect, Suspense, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Backdrop, CircularProgress, Alert, Box, Button } from '@mui/material'
import { useAuth } from 'src/store'
import { isObjectEmpty } from 'src/utils/helper'
import { Roles } from 'src/utils/types'

interface AdminRouteProps {
  element: ReactNode
  minimumRole?: Roles
}

const ADMIN_ROLES = [
  Roles.ADMIN,
  Roles.SUPERADMINEMPLOYEE,
  Roles.SUPERADMIN
]

const ADMIN_ROLE_NAMES = [
  'ADMIN',
  'ADMINISTRATOR',
  'SUPERADMINEMPLOYEE',
  'SUPERADMIN',
  'admin',
  'administrator',
  'superadminemployee',
  'superadmin'
]

const AdminRoute = ({ element, minimumRole = Roles.ADMIN }: AdminRouteProps) => {
  const { user, refreshAuth } = useAuth()
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        if (typeof refreshAuth === 'function') {
          await refreshAuth()
        }
      } catch (error) {
        console.error('Session check failed:', error)
        setSessionError('Your session has expired. Please log in again.')
      } finally {
        setIsChecking(false)
      }
    }
    checkSession()
  }, [refreshAuth])
  
  if (isChecking) {
    return (
      <Backdrop open style={{ background: '#FFF', zIndex: 1301 }}>
        <CircularProgress color='inherit' />
      </Backdrop>
    )
  }
  
  const isAuthenticated = user && typeof user !== 'string' && !isObjectEmpty(user)
  
  if (sessionError) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
          p: 3
        }}
      >
        <Alert severity="warning" sx={{ maxWidth: 500 }}>
          {sessionError}
        </Alert>
        <Button
          variant="contained"
          onClick={() => window.location.href = '/auth/signin'}
        >
          Go to Login
        </Button>
      </Box>
    )
  }
  
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/auth/signin"
        replace
        state={{ from: location }}
      />
    )
  }
  
  const userData = (user as any).user || user
  const userRole = userData.role
  const isAdmin = typeof userRole === 'string'
    ? ADMIN_ROLE_NAMES.includes(userRole) || ADMIN_ROLE_NAMES.includes(userRole.toUpperCase())
    : ADMIN_ROLES.includes(userRole as Roles)
  
  if (!isAdmin) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
          p: 3,
          textAlign: 'center'
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          <strong>403 - Forbidden</strong>
          <br />
          You don't have administrator privileges to access this page.
        </Alert>
        <Button
          variant="contained"
          onClick={() => window.location.href = '/dashboard'}
        >
          Go to Dashboard
        </Button>
      </Box>
    )
  }
  
  if (userRole < minimumRole) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
          p: 3,
          textAlign: 'center'
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          <strong>Insufficient Permissions</strong>
          <br />
          This admin feature requires higher privileges.
        </Alert>
        <Button
          variant="contained"
          onClick={() => window.location.href = '/admin'}
        >
          Go to Admin Dashboard
        </Button>
      </Box>
    )
  }

  return (
    <Suspense
      fallback={
        <Backdrop open style={{ background: '#FFF', zIndex: 1301 }}>
          <CircularProgress color='inherit' />
        </Backdrop>
      }
    >
      {element}
    </Suspense>
  )
}

export default AdminRoute
