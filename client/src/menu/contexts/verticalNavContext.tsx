/**
 * Vertical Navigation Context - Backward Compatibility Layer
 * 
 * This file re-exports Zustand hooks for backward compatibility.
 * All new code should import directly from 'src/store'
 * 
 * @deprecated Use `import { useVerticalNav } from 'src/store'` instead
 */

import React from 'react'
import { useVerticalNav as useZustandVerticalNav } from 'src/store'
import type { VerticalMenuContextProps } from '../components/vertical-menu/Menu'

export interface VerticalNavState {
  width?: number
  collapsedWidth?: number
  isCollapsed?: boolean
  isHovered?: boolean
  isToggled?: boolean
  isScrollWithContent?: boolean
  isBreakpointReached?: boolean
  isPopoutWhenCollapsed?: boolean
  collapsing?: boolean
  expanding?: boolean
  transitionDuration?: number
}

export interface VerticalNavContextProps extends VerticalNavState {
  updateVerticalNavState: (values: Partial<VerticalNavState>) => void
  collapseVerticalNav: (value?: boolean) => void
  hoverVerticalNav: (value?: boolean) => void
  toggleVerticalNav: (value?: boolean) => void
}

// Context for backward compatibility (not actually used)
export const VerticalNavContext = React.createContext<VerticalNavContextProps | null>(null)

// Provider for backward compatibility (not actually used)
export const VerticalNavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}

/**
 * @deprecated Use `import { useVerticalNav } from 'src/store'` instead
 */
export const useVerticalNav = (): VerticalNavContextProps => {
  return useZustandVerticalNav()
}

/**
 * @deprecated Use `import { useVerticalNav } from 'src/store'` instead
 */
export const useVerticalMenu = (): VerticalMenuContextProps => {
  // Import the VerticalMenuContext from Menu component
  const { VerticalMenuContext } = require('../components/vertical-menu/Menu')
  const context = React.useContext(VerticalMenuContext)
  
  if (!context) {
    throw new Error('useVerticalMenu must be used within a VerticalMenuContext.Provider')
  }
  
  return context
}

export default VerticalNavContext
