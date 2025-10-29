/**
 * Storage Utilities
 * 
 * Provides a unified interface for managing different types of storage:
 * - localStorage: Persistent storage for authenticated users
 * - sessionStorage: Temporary storage for guest users
 * - IndexedDB: Large data storage (future implementation)
 * 
 * Features:
 * - Type-safe storage operations
 * - Automatic JSON serialization/deserialization
 * - Error handling
 * - Storage quota management
 */

export enum StorageType {
  LOCAL = 'localStorage',
  SESSION = 'sessionStorage',
}

export class StorageManager {
  private storage: Storage

  constructor(type: StorageType = StorageType.LOCAL) {
    this.storage = type === StorageType.LOCAL ? localStorage : sessionStorage
  }

  /**
   * Set item in storage
   */
  set<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value)
      this.storage.setItem(key, serialized)
      return true
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error)
      return false
    }
  }

  /**
   * Get item from storage
   */
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = this.storage.getItem(key)
      if (item === null) {
        return defaultValue !== undefined ? defaultValue : null
      }
      return JSON.parse(item) as T
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error)
      return defaultValue !== undefined ? defaultValue : null
    }
  }

  /**
   * Remove item from storage
   */
  remove(key: string): boolean {
    try {
      this.storage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error)
      return false
    }
  }

  /**
   * Clear all items from storage
   */
  clear(): boolean {
    try {
      this.storage.clear()
      return true
    } catch (error) {
      console.error('Error clearing storage:', error)
      return false
    }
  }

  /**
   * Check if key exists in storage
   */
  has(key: string): boolean {
    return this.storage.getItem(key) !== null
  }

  /**
   * Get all keys in storage
   */
  keys(): string[] {
    return Object.keys(this.storage)
  }

  /**
   * Get storage size in bytes
   */
  getSize(): number {
    let size = 0
    for (const key in this.storage) {
      if (this.storage.hasOwnProperty(key)) {
        size += key.length + (this.storage.getItem(key)?.length || 0)
      }
    }
    return size
  }

  /**
   * Get available storage space (approximate)
   */
  async getAvailableSpace(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      const quota = estimate.quota || 0
      const usage = estimate.usage || 0
      return quota - usage
    }
    return -1 // Unknown
  }
}

// Create singleton instances
export const localStorageManager = new StorageManager(StorageType.LOCAL)
export const sessionStorageManager = new StorageManager(StorageType.SESSION)

/**
 * Storage Keys Constants
 */
export const STORAGE_KEYS = {
  // Auth
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  
  // Guest
  GUEST_SESSION: 'linkedin-scraper-guest-session',
  
  // Preferences
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  
  // Jobs
  SAVED_JOBS: 'saved_jobs',
  SEARCH_FILTERS: 'search_filters',
  RECENT_SEARCHES: 'recent_searches',
  
  // Profiles
  RESUME_PROFILES: 'resume_profiles',
  ACTIVE_PROFILE: 'active_profile',
  
  // Notifications
  NOTIFICATIONS: 'notifications',
  
  // State
  ZUSTAND_STORAGE: 'linkedin-scraper-storage',
} as const

/**
 * Helper functions for common operations
 */

export const saveAuthTokens = (accessToken: string, refreshToken: string) => {
  localStorageManager.set(STORAGE_KEYS.AUTH_TOKEN, accessToken)
  localStorageManager.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
}

export const getAuthToken = (): string | null => {
  return localStorageManager.get<string>(STORAGE_KEYS.AUTH_TOKEN)
}

export const clearAuthTokens = () => {
  localStorageManager.remove(STORAGE_KEYS.AUTH_TOKEN)
  localStorageManager.remove(STORAGE_KEYS.REFRESH_TOKEN)
}

export const saveUserData = (userData: any) => {
  localStorageManager.set(STORAGE_KEYS.USER_DATA, userData)
}

export const getUserData = () => {
  return localStorageManager.get(STORAGE_KEYS.USER_DATA)
}

export const clearUserData = () => {
  localStorageManager.remove(STORAGE_KEYS.USER_DATA)
}

/**
 * Clear all app data (logout)
 */
export const clearAllAppData = () => {
  const keysToKeep = [STORAGE_KEYS.THEME, STORAGE_KEYS.LANGUAGE]
  const allKeys = localStorageManager.keys()
  
  allKeys.forEach((key) => {
    if (!keysToKeep.includes(key)) {
      localStorageManager.remove(key)
    }
  })
  
  sessionStorageManager.clear()
}

/**
 * Storage event listener for cross-tab synchronization
 */
export const onStorageChange = (
  callback: (event: StorageEvent) => void
): (() => void) => {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

export default StorageManager
