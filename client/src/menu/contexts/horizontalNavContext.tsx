/**
 * Horizontal Navigation Context - Backward Compatibility Layer
 * 
 * This file re-exports Zustand hooks for backward compatibility.
 * All new code should import directly from 'src/store'
 * 
 * @deprecated Use `import { useHorizontalNav } from 'src/store'` instead
 */

import React from 'react'
import { useHorizontalNav as useZustandHorizontalNav } from 'src/store'

export interface HorizontalNavState {
  isBreakpointReached?: boolean
}

export interface HorizontalNavContextProps extends HorizontalNavState {
  updateIsBreakpointReached: (isBreakpointReached: boolean) => void
}

// Context for backward compatibility (not actually used)
export const HorizontalNavContext = React.createContext<HorizontalNavContextProps | null>(null)

// Provider for backward compatibility (not actually used)
export const HorizontalNavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}

/**
 * @deprecated Use `import { useHorizontalNav } from 'src/store'` instead
 */
export const useHorizontalNav = (): HorizontalNavContextProps => {
  return useZustandHorizontalNav()
}

/**
 * @deprecated Use `import { useHorizontalNav } from 'src/store'` instead
 */
export const useHorizontalMenu = () => {
  // Return empty object for menu-specific context (if needed)
  return {}
}

export default HorizontalNavContext
