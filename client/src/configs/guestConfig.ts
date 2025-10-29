/**
 * Guest User Configuration
 * 
 * Centralized configuration for guest user limitations and permissions.
 * Adjust these values to control guest access to various features.
 */

export interface GuestConfig {
  // Profile Analyzer limits
  maxProfileAnalysis: number
  
  // Job Search limits
  maxJobResults: number
  maxJobViews: number
  
  // Feature permissions
  allowJobSearch: boolean
  allowProfileAnalyzer: boolean
  allowJobDetails: boolean
  allowCompanyView: boolean
  allowStatistics: boolean
  allowScraping: boolean
  allowDashboard: boolean
  allowApplicationTracking: boolean
  
  // UI Configuration
  showBannerOnEveryPage: boolean
  bannerDismissible: boolean
  showRoleIndicator: boolean
  
  // Session Configuration
  sessionTimeoutMinutes: number // 0 = until browser close
  autoCreateGuestSession: boolean
  
  // Messaging
  defaultBannerMessage: string
  featureLockedMessage: string
}

export const GUEST_CONFIG: GuestConfig = {
  // Profile Analyzer
  maxProfileAnalysis: 1,
  
  // Job Search
  maxJobResults: 10,
  maxJobViews: 50,
  
  // Feature Permissions
  allowJobSearch: true,
  allowProfileAnalyzer: true,
  allowJobDetails: true,
  allowCompanyView: false,
  allowStatistics: false,
  allowScraping: false,
  allowDashboard: false,
  allowApplicationTracking: false,
  
  // UI Settings
  showBannerOnEveryPage: false,
  bannerDismissible: true,
  showRoleIndicator: true,
  
  // Session Settings
  sessionTimeoutMinutes: 0, // Session-only (cleared on browser close)
  autoCreateGuestSession: true,
  
  // Messages
  defaultBannerMessage: 'You are browsing as a guest. Sign up to unlock all features!',
  featureLockedMessage: 'This feature requires a free account. Sign up to continue.',
}

/**
 * Check if a specific feature is allowed for guests
 */
export const isFeatureAllowedForGuest = (featureName: keyof GuestConfig): boolean => {
  const value = GUEST_CONFIG[featureName]
  return typeof value === 'boolean' ? value : false
}

/**
 * Get guest limit for a specific feature
 */
export const getGuestLimit = (limitName: keyof GuestConfig): number => {
  const value = GUEST_CONFIG[limitName]
  return typeof value === 'number' ? value : 0
}

export default GUEST_CONFIG
