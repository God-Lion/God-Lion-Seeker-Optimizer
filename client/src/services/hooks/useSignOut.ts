import { useNavigate } from 'react-router-dom'
import { useLogout } from '../../Modules/Auth/hooks/useAuthQuery'
import { useAuth } from '../../store'
import StorageManager from '../storage'

interface UseSignOutOptions {
  redirectTo?: string
  onSuccess?: () => void
  onError?: (error: any) => void
}

/**
 * Custom hook for handling user sign out
 * 
 * Provides a unified signout function that:
 * - Calls the backend logout API
 * - Clears all authentication data
 * - Resets application state
 * - Redirects to specified page
 * 
 * @example
 * ```tsx
 * const { signOut, isSigningOut } = useSignOut({
 *   redirectTo: '/auth/signin',
 *   onSuccess: () => console.log('Signed out successfully')
 * })
 * 
 * <Button onClick={signOut}>Sign Out</Button>
 * ```
 */
export const useSignOut = (options: UseSignOutOptions = {}) => {
  const {
    redirectTo = '/auth/signin',
    onSuccess: customOnSuccess,
    onError: customOnError,
  } = options

  const navigate = useNavigate()
  const { signOut: zustandSignOut } = useAuth()

  const { mutate: logout, isPending: isSigningOut } = useLogout({
    onSuccess: () => {
      console.log('[useSignOut] Logout API call successful')

      // Clear Zustand store
      zustandSignOut()

      // Clear all app data from storage (tokens, user data, etc.)
      StorageManager.clearAllUserData()

      // Call custom success callback
      customOnSuccess?.()

      // Redirect to specified page
      navigate(redirectTo, { replace: true })
    },
    onError: (error: unknown) => {
      console.error('[useSignOut] Logout API call failed:', error)

      // Even if API fails, clear local data
      zustandSignOut()
      StorageManager.clearAllUserData()

      // Call custom error callback
      customOnError?.(error)

      // Still redirect to login
      navigate(redirectTo, { replace: true })
    },
  })

  const signOut = () => {
    console.log('[useSignOut] Initiating sign out...')
    logout()
  }

  return {
    signOut,
    isSigningOut,
  }
}

export default useSignOut
