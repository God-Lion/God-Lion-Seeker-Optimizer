import { StateCreator } from 'zustand'
import type { AppStore } from '../index'

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'fr' | 'ar'
  
  notifications: {
    email: boolean
    push: boolean
    jobMatches: boolean
    applicationUpdates: boolean
    scraperComplete: boolean
  }
  
  jobPreferences: {
    defaultSearchRadius: number
    preferredLocations: string[]
    preferredJobTypes: string[]
    salaryExpectation: {
      min: number
      max: number
      currency: string
    }
  }
  
  privacy: {
    profileVisibility: 'public' | 'private'
    shareAnalytics: boolean
  }
  
  display: {
    jobsPerPage: number
    showSalary: boolean
    showCompanyRatings: boolean
  }
}

export interface PreferencesSlice {
  preferences: UserPreferences

  updatePreferences: (updates: Partial<UserPreferences>) => void
  resetPreferences: () => void
  updateNotificationPreferences: (
    updates: Partial<UserPreferences['notifications']>
  ) => void
  updateJobPreferences: (
    updates: Partial<UserPreferences['jobPreferences']>
  ) => void
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'en',
  notifications: {
    email: true,
    push: true,
    jobMatches: true,
    applicationUpdates: true,
    scraperComplete: true,
  },
  jobPreferences: {
    defaultSearchRadius: 25,
    preferredLocations: [],
    preferredJobTypes: [],
    salaryExpectation: {
      min: 0,
      max: 200000,
      currency: 'USD',
    },
  },
  privacy: {
    profileVisibility: 'private',
    shareAnalytics: false,
  },
  display: {
    jobsPerPage: 20,
    showSalary: true,
    showCompanyRatings: true,
  },
}

export const createPreferencesSlice: StateCreator<
  AppStore,
  [['zustand/immer', never], ['zustand/persist', unknown]],
  [],
  PreferencesSlice
> = (set) => ({
  preferences: defaultPreferences,

  updatePreferences: (updates: Partial<UserPreferences>) => {
    set((state) => {
      state.preferences = {
        ...state.preferences,
        ...updates,
      }
    })
  },

  resetPreferences: () => {
    set((state) => {
      state.preferences = defaultPreferences
    })
  },

  updateNotificationPreferences: (
    updates: Partial<UserPreferences['notifications']>
  ) => {
    set((state) => {
      state.preferences.notifications = {
        ...state.preferences.notifications,
        ...updates,
      }
    })
  },

  updateJobPreferences: (
    updates: Partial<UserPreferences['jobPreferences']>
  ) => {
    set((state) => {
      state.preferences.jobPreferences = {
        ...state.preferences.jobPreferences,
        ...updates,
      }
    })
  },
})
