import { useEffect, useState, Suspense, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Backdrop, CircularProgress } from '@mui/material'
import { useAuth } from 'src/store'
import { isObjectEmpty } from 'src/utils/helper'

interface GuestRouteProps {
  element: ReactNode
  redirectTo?: string
}

/**
 * GuestRoute Component
 * 
 * Route guard that allows access ONLY to unauthenticated users (guests).
 * If user is authenticated, they will be redirected to the dashboard.
 */
const GuestRoute = ({ element, redirectTo = '/dashboard' }: GuestRouteProps) => {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsChecking(false)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  if (isChecking) {
    return (
      <Backdrop open style={{ background: '#FFF', zIndex: 1301 }}>
        <CircularProgress color='inherit' />
      </Backdrop>
    )
  }

  if (isAuthenticated && user && !isObjectEmpty(user)) {
    const from = (location.state as any)?.from?.pathname || redirectTo
    return <Navigate to={from} replace state={{ from: location }} />
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

export default GuestRoute
