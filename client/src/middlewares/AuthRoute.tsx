import { useState, useEffect, Suspense, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Backdrop, CircularProgress, Alert, Box, Button } from '@mui/material'
import { useAuth } from 'src/store'
import { Roles } from 'src/utils/types'

interface AuthRouteProps {
  element: ReactNode
  allowedRoles?: Roles[]
  requiresVerification?: boolean
}

const AuthRoute = ({
  element,
  allowedRoles,
  requiresVerification = false
}: AuthRouteProps) => {
  const { user, isAuthenticated, refreshAuth } = useAuth()
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        await refreshAuth()
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
  
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user as any).role
    const hasAccess = allowedRoles.includes(userRole)
  
    if (!hasAccess) {
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
          <Alert severity="error" sx={{ maxWidth: 500 }}>
            You don't have permission to access this page.
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
  }
  
  if (requiresVerification) {
    const isVerified = (user as any).isVerified || (user as any).emailVerified
  
    if (!isVerified) {
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
            Please verify your email address to access this feature.
            Check your inbox for a verification email.
          </Alert>
          <Button
            variant="contained"
            onClick={() => window.location.href = '/auth/verification/email'}
          >
            Resend Verification Email
          </Button>
        </Box>
      )
    }
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

export default AuthRoute
