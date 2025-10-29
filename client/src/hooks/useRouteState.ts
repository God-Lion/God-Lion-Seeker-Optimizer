/**
 * useRouteState Hook
 * 
 * Custom hook to persist component state across route changes.
 * Useful for maintaining search filters, form data, pagination state, etc.
 * when users navigate away and return to a page.
 * 
 * @example
 * const [searchFilters, setSearchFilters] = useRouteState('job_search_filters', {
 *   query: '',
 *   location: '',
 *   company: ''
 * })
 */

import { useState, useEffect, useCallback } from 'react'

interface UseRouteStateOptions<T> {
  storage?: 'session' | 'local'
  serialize?: (value: T) => string
  deserialize?: (value: string) => T
}

export function useRouteState<T>(
  key: string,
  initialValue: T,
  options: UseRouteStateOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    storage = 'session',
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options

  const storageKey = `route_state_${key}`
  const storageObject = storage === 'session' ? sessionStorage : localStorage

  // Initialize state from storage or use initial value
  const [state, setState] = useState<T>(() => {
    try {
      const saved = storageObject.getItem(storageKey)
      if (saved) {
        return deserialize(saved)
      }
    } catch (error) {
      console.error(`Error loading route state for key "${key}":`, error)
    }
    return initialValue
  })

  // Save to storage whenever state changes
  useEffect(() => {
    try {
      storageObject.setItem(storageKey, serialize(state))
    } catch (error) {
      console.error(`Error saving route state for key "${key}":`, error)
    }
  }, [key, state, storageKey, serialize, storageObject])

  // Clear function to reset state and remove from storage
  const clearState = useCallback(() => {
    try {
      storageObject.removeItem(storageKey)
      setState(initialValue)
    } catch (error) {
      console.error(`Error clearing route state for key "${key}":`, error)
    }
  }, [key, initialValue, storageKey, storageObject])

  return [state, setState, clearState]
}

/**
 * Hook to check if state exists for a given key
 */
export function useHasRouteState(
  key: string,
  storage: 'session' | 'local' = 'session'
): boolean {
  const storageKey = `route_state_${key}`
  const storageObject = storage === 'session' ? sessionStorage : localStorage

  const [hasState, setHasState] = useState(() => {
    try {
      return storageObject.getItem(storageKey) !== null
    } catch {
      return false
    }
  })

  useEffect(() => {
    const checkState = () => {
      try {
        setHasState(storageObject.getItem(storageKey) !== null)
      } catch {
        setHasState(false)
      }
    }

    // Check on mount and when storage changes
    checkState()
    window.addEventListener('storage', checkState)

    return () => {
      window.removeEventListener('storage', checkState)
    }
  }, [storageKey, storageObject])

  return hasState
}

/**
 * Hook to clear all route states
 */
export function useClearAllRouteStates(
  storage: 'session' | 'local' = 'session'
): () => void {
  const storageObject = storage === 'session' ? sessionStorage : localStorage

  return useCallback(() => {
    try {
      const keys = Object.keys(storageObject)
      keys.forEach(key => {
        if (key.startsWith('route_state_')) {
          storageObject.removeItem(key)
        }
      })
    } catch (error) {
      console.error('Error clearing all route states:', error)
    }
  }, [storageObject])
}

/**
 * Hook to restore route state only once (useful for one-time restoration)
 */
export function useRestoreRouteState<T>(
  key: string,
  onRestore?: (value: T) => void,
  storage: 'session' | 'local' = 'session'
): void {
  const storageKey = `route_state_${key}`
  const storageObject = storage === 'session' ? sessionStorage : localStorage

  useEffect(() => {
    try {
      const saved = storageObject.getItem(storageKey)
      if (saved && onRestore) {
        const value = JSON.parse(saved) as T
        onRestore(value)
        // Clear after restoration to prevent re-restoration
        storageObject.removeItem(storageKey)
      }
    } catch (error) {
      console.error(`Error restoring route state for key "${key}":`, error)
    }
  }, []) // Empty deps - only run once on mount
}

export default useRouteState
