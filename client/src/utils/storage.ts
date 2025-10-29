/**
 * Storage Manager Utility
 * 
 * Provides unified interface for different storage mechanisms:
 * - IndexedDB for large datasets (job listings, company data)
 * - LocalStorage for user preferences (with encryption for sensitive data)
 * - SessionStorage for temporary guest data
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb'

// IndexedDB Schema
interface AppDB extends DBSchema {
  jobs: {
    key: string
    value: {
      id: string
      data: any
      timestamp: number
    }
  }
  companies: {
    key: string
    value: {
      id: string
      data: any
      timestamp: number
    }
  }
  profiles: {
    key: string
    value: {
      id: string
      data: any
      timestamp: number
    }
  }
  applications: {
    key: string
    value: {
      id: string
      data: any
      timestamp: number
    }
  }
}

class StorageManager {
  private static dbName = 'linkedin-scraper-db'
  private static dbVersion = 1
  private static db: IDBPDatabase<AppDB> | null = null

  /**
   * Initialize IndexedDB
   */
  private static async initDB(): Promise<IDBPDatabase<AppDB>> {
    if (this.db) return this.db

    this.db = await openDB<AppDB>(this.dbName, this.dbVersion, {
      upgrade(db) {
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('jobs')) {
          db.createObjectStore('jobs', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('companies')) {
          db.createObjectStore('companies', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('applications')) {
          db.createObjectStore('applications', { keyPath: 'id' })
        }
      },
    })

    return this.db
  }

  /**
   * Save data to IndexedDB
   * Use for large datasets (job listings, company data)
   */
  static async saveToIndexedDB<T extends keyof AppDB>(
    storeName: T,
    key: string,
    data: any
  ): Promise<void> {
    try {
      const db = await this.initDB()
      await db.put(storeName, {
        id: key,
        data,
        timestamp: Date.now(),
      })
    } catch (error) {
      console.error('IndexedDB save error:', error)
      throw error
    }
  }

  /**
   * Get data from IndexedDB
   */
  static async getFromIndexedDB<T extends keyof AppDB>(
    storeName: T,
    key: string
  ): Promise<any | null> {
    try {
      const db = await this.initDB()
      const result = await db.get(storeName, key)
      return result?.data || null
    } catch (error) {
      console.error('IndexedDB get error:', error)
      return null
    }
  }

  /**
   * Get all data from a store
   */
  static async getAllFromIndexedDB<T extends keyof AppDB>(
    storeName: T
  ): Promise<any[]> {
    try {
      const db = await this.initDB()
      const results = await db.getAll(storeName)
      return results.map(r => r.data)
    } catch (error) {
      console.error('IndexedDB getAll error:', error)
      return []
    }
  }

  /**
   * Delete from IndexedDB
   */
  static async deleteFromIndexedDB<T extends keyof AppDB>(
    storeName: T,
    key: string
  ): Promise<void> {
    try {
      const db = await this.initDB()
      await db.delete(storeName, key)
    } catch (error) {
      console.error('IndexedDB delete error:', error)
      throw error
    }
  }

  /**
   * Clear entire store
   */
  static async clearIndexedDBStore<T extends keyof AppDB>(
    storeName: T
  ): Promise<void> {
    try {
      const db = await this.initDB()
      await db.clear(storeName)
    } catch (error) {
      console.error('IndexedDB clear error:', error)
      throw error
    }
  }

  /**
   * Save to LocalStorage
   * Use for user preferences (with optional encryption for sensitive data)
   */
  static saveToLocalStorage(key: string, data: any, encrypt = false): void {
    try {
      const value = encrypt ? this.encryptData(JSON.stringify(data)) : JSON.stringify(data)
      localStorage.setItem(key, value)
    } catch (error) {
      console.error('LocalStorage save error:', error)
      throw error
    }
  }

  /**
   * Get from LocalStorage
   */
  static getFromLocalStorage<T = any>(key: string, decrypt = false): T | null {
    try {
      const value = localStorage.getItem(key)
      if (!value) return null

      const parsed = decrypt ? this.decryptData(value) : value
      return JSON.parse(parsed)
    } catch (error) {
      console.error('LocalStorage get error:', error)
      return null
    }
  }

  /**
   * Delete from LocalStorage
   */
  static deleteFromLocalStorage(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('LocalStorage delete error:', error)
      throw error
    }
  }

  /**
   * Save to SessionStorage
   * Use for temporary guest data
   */
  static saveToSessionStorage(key: string, data: any): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('SessionStorage save error:', error)
      throw error
    }
  }

  /**
   * Get from SessionStorage
   */
  static getFromSessionStorage<T = any>(key: string): T | null {
    try {
      const value = sessionStorage.getItem(key)
      if (!value) return null
      return JSON.parse(value)
    } catch (error) {
      console.error('SessionStorage get error:', error)
      return null
    }
  }

  /**
   * Delete from SessionStorage
   */
  static deleteFromSessionStorage(key: string): void {
    try {
      sessionStorage.removeItem(key)
    } catch (error) {
      console.error('SessionStorage delete error:', error)
      throw error
    }
  }

  /**
   * Clear all user data on logout
   */
  static clearAllUserData(): void {
    try {
      // Clear localStorage
      localStorage.clear()

      // Clear sessionStorage
      sessionStorage.clear()

      // Clear IndexedDB
      this.clearAllIndexedDB()
    } catch (error) {
      console.error('Clear all user data error:', error)
      throw error
    }
  }

  /**
   * Clear all IndexedDB data
   */
  static async clearAllIndexedDB(): Promise<void> {
    try {
      const db = await this.initDB()
      const storeNames = db.objectStoreNames
      
      for (let i = 0; i < storeNames.length; i++) {
        await db.clear(storeNames[i] as keyof AppDB)
      }
    } catch (error) {
      console.error('Clear all IndexedDB error:', error)
      throw error
    }
  }

  /**
   * Simple encryption (Base64) - Replace with proper encryption for production
   * For production, use crypto-js or similar library
   */
  private static encryptData(data: string): string {
    // Simple Base64 encoding (NOT SECURE - use proper encryption in production)
    return btoa(data)
  }

  /**
   * Simple decryption (Base64) - Replace with proper decryption for production
   */
  private static decryptData(data: string): string {
    // Simple Base64 decoding (NOT SECURE - use proper decryption in production)
    return atob(data)
  }

  /**
   * Get storage quota information
   */
  static async getStorageQuota(): Promise<{
    usage: number
    quota: number
    percentUsed: number
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      const usage = estimate.usage || 0
      const quota = estimate.quota || 0
      const percentUsed = quota > 0 ? (usage / quota) * 100 : 0

      return {
        usage,
        quota,
        percentUsed,
      }
    }

    return {
      usage: 0,
      quota: 0,
      percentUsed: 0,
    }
  }

  /**
   * Check if storage is available
   */
  static isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
    try {
      const storage = window[type]
      const test = '__storage_test__'
      storage.setItem(test, test)
      storage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  }
}

export default StorageManager

// Export storage managers for backward compatibility
export const localStorageManager = {
  set: (key: string, value: any, encrypt = false) => StorageManager.saveToLocalStorage(key, value, encrypt),
  get: <T = any>(key: string, decrypt = false) => StorageManager.getFromLocalStorage<T>(key, decrypt),
  has: (key: string) => {
    try {
      return localStorage.getItem(key) !== null
    } catch {
      return false
    }
  },
  remove: (key: string) => StorageManager.deleteFromLocalStorage(key),
  clear: () => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('LocalStorage clear error:', error)
    }
  }
}

export const sessionStorageManager = {
  set: (key: string, value: any) => StorageManager.saveToSessionStorage(key, value),
  get: <T = any>(key: string) => StorageManager.getFromSessionStorage<T>(key),
  has: (key: string) => {
    try {
      return sessionStorage.getItem(key) !== null
    } catch {
      return false
    }
  },
  remove: (key: string) => StorageManager.deleteFromSessionStorage(key),
  clear: () => {
    try {
      sessionStorage.clear()
    } catch (error) {
      console.error('SessionStorage clear error:', error)
    }
  }
}

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  USER_PREFERENCES: 'user_preferences',
  SAVED_JOBS: 'saved_jobs',
  RESUME_PROFILES: 'resume_profiles',
  NOTIFICATIONS: 'notifications',
  GUEST_SESSION: 'guest_session',
  THEME_PREFERENCES: 'theme_preferences',
  LANGUAGE: 'language',
} as const
