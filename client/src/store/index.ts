import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'


import { createAuthSlice, AuthSlice } from './slices/authSlice'
import { createGuestSlice, GuestSlice } from './slices/guestSlice'
import { createJobsSlice, JobsSlice } from './slices/jobsSlice'
import { createProfileSlice, ProfileSlice } from './slices/profileSlice'
import { createNotificationSlice, NotificationSlice } from './slices/notificationSlice'
import { createPreferencesSlice, PreferencesSlice } from './slices/preferencesSlice'
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice'
import { createNavigationSlice, NavigationSlice } from './slices/navigationSlice'
import { createThemeSlice, ThemeSlice } from './slices/themeSlice'


export type AppStore = AuthSlice & 
  GuestSlice & 
  JobsSlice & 
  ProfileSlice & 
  NotificationSlice & 
  PreferencesSlice &
  SettingsSlice &
  NavigationSlice &
  ThemeSlice

/**
 * Main Application Store
 * 
 * Uses Zustand with middleware for:
 * - Persistence (localStorage for auth, sessionStorage for guests)
 * - DevTools (Redux DevTools support)
 * - Immer (Immutable state updates)
 *
 * @see https://github.com/pmndrs/zustand
 */
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      immer((...args) => ({
        ...createAuthSlice(...args),
        ...createGuestSlice(...args),
        ...createJobsSlice(...args),
        ...createProfileSlice(...args),
        ...createNotificationSlice(...args),
        ...createPreferencesSlice(...args),
        ...createSettingsSlice(...args),
        ...createNavigationSlice(...args),
        ...createThemeSlice(...args),
      })),
      {
        name: 'god-lion-seeker-optimizer-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          auth: {
            user: state.user,
            isAuthenticated: state.isAuthenticated,
          },
          preferences: state.preferences,
          settings: state.settings,
          theme: {
            mode: state.mode,
          },
        }),
      }
    ),
    {
      name: 'God Lion Seeker Optimizer Store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)


export const useAuth = () => {
  const user = useAppStore(state => state.user)
  const isAuthenticated = useAppStore(state => state.isAuthenticated)
  const isLoading = useAppStore(state => state.isLoading)
  const error = useAppStore(state => state.error)
  const tokens = useAppStore(state => state.tokens)
  const signIn = useAppStore(state => state.signIn)
  const signOut = useAppStore(state => state.signOut)
  const refreshAuth = useAppStore(state => state.refreshAuth)
  const refreshToken = useAppStore(state => state.refreshToken)
  const updateUser = useAppStore(state => state.updateUser)
  const setUser = useAppStore(state => state.setUser)
  const setTokens = useAppStore(state => state.setTokens)
  const clearError = useAppStore(state => state.clearError)

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    tokens,
    signIn,
    signOut,
    refreshAuth,
    refreshToken,
    updateUser,
    setUser,
    setTokens,
    clearError,
  }
}

export const useGuest = () => {
  const guestSession = useAppStore(state => state.guestSession)
  const isGuest = useAppStore(state => state.isGuest)
  const createGuestSession = useAppStore(state => state.createGuestSession)
  const clearGuestSession = useAppStore(state => state.clearGuestSession)
  const addGuestData = useAppStore(state => state.addGuestData)
  const getGuestData = useAppStore(state => state.getGuestData)
  const incrementAnalysisCount = useAppStore(state => state.incrementAnalysisCount)
  const getAnalysisCount = useAppStore(state => state.getAnalysisCount)

  return {
    guestSession,
    isGuest,
    createGuestSession,
    clearGuestSession,
    addGuestData,
    getGuestData,
    incrementAnalysisCount,
    analysisCounts: getAnalysisCount(),
  }
}

export const useJobs = () => {
  const jobs = useAppStore(state => state.jobs)
  const savedJobs = useAppStore(state => state.savedJobs)
  const applications = useAppStore(state => state.applications)
  const searchFilters = useAppStore(state => state.searchFilters)
  const pagination = useAppStore(state => state.pagination)
  const setJobs = useAppStore(state => state.setJobs)
  const addJob = useAppStore(state => state.addJob)
  const updateJob = useAppStore(state => state.updateJob)
  const deleteJob = useAppStore(state => state.deleteJob)
  const saveJob = useAppStore(state => state.saveJob)
  const unsaveJob = useAppStore(state => state.unsaveJob)
  const addApplication = useAppStore(state => state.addApplication)
  const updateApplication = useAppStore(state => state.updateApplication)
  const setSearchFilters = useAppStore(state => state.setSearchFilters)
  const resetSearchFilters = useAppStore(state => state.resetSearchFilters)

  return {
    jobs,
    savedJobs,
    applications,
    searchFilters,
    pagination,
    setJobs,
    addJob,
    updateJob,
    deleteJob,
    saveJob,
    unsaveJob,
    addApplication,
    updateApplication,
    setSearchFilters,
    resetSearchFilters,
  }
}

export const useProfile = () => {
  const profiles = useAppStore(state => state.profiles)
  const activeProfile = useAppStore(state => state.activeProfile)
  const addProfile = useAppStore(state => state.addProfile)
  const updateProfile = useAppStore(state => state.updateProfile)
  const deleteProfile = useAppStore(state => state.deleteProfile)
  const setActiveProfile = useAppStore(state => state.setActiveProfile)

  return {
    profiles,
    activeProfile,
    addProfile,
    updateProfile,
    deleteProfile,
    setActiveProfile,
  }
}

export const useNotifications = () => {
  const notifications = useAppStore(state => state.notifications)
  const unreadCount = useAppStore(state => state.unreadCount)
  const addNotification = useAppStore(state => state.addNotification)
  const markAsRead = useAppStore(state => state.markAsRead)
  const markAllAsRead = useAppStore(state => state.markAllAsRead)
  const deleteNotification = useAppStore(state => state.deleteNotification)
  const clearNotifications = useAppStore(state => state.clearNotifications)

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
  }
}

export const usePreferences = () => {
  const preferences = useAppStore(state => state.preferences)
  const updatePreferences = useAppStore(state => state.updatePreferences)
  const resetPreferences = useAppStore(state => state.resetPreferences)

  return {
    preferences,
    updatePreferences,
    resetPreferences,
  }
}

export const useSettings = () => {
  const settings = useAppStore(state => state.settings)
  const isSettingsChanged = useAppStore(state => state.isSettingsChanged)
  const updateSettings = useAppStore(state => state.updateSettings)
  const resetSettings = useAppStore(state => state.resetSettings)
  const updatePageSettings = useAppStore(state => state.updatePageSettings)

  return {
    settings,
    isSettingsChanged,
    updateSettings,
    resetSettings,
    updatePageSettings,
  }
}

export const useVerticalNav = () => {
  const verticalNav = useAppStore(state => state.verticalNav)
  const updateVerticalNavState = useAppStore(state => state.updateVerticalNavState)
  const collapseVerticalNav = useAppStore(state => state.collapseVerticalNav)
  const hoverVerticalNav = useAppStore(state => state.hoverVerticalNav)
  const toggleVerticalNav = useAppStore(state => state.toggleVerticalNav)

  return {
    ...verticalNav,
    updateVerticalNavState,
    collapseVerticalNav,
    hoverVerticalNav,
    toggleVerticalNav,
  }
}

export const useHorizontalNav = () => {
  const horizontalNav = useAppStore(state => state.horizontalNav)
  const updateIsBreakpointReached = useAppStore(state => state.updateIsBreakpointReached)

  return {
    ...horizontalNav,
    updateIsBreakpointReached,
  }
}

export const useTheme = () => {
  const mode = useAppStore(state => state.mode)
  const toggleColorMode = useAppStore(state => state.toggleColorMode)
  const setMode = useAppStore(state => state.setMode)

  return {
    mode,
    toggleColorMode,
    setMode,
  }
}
