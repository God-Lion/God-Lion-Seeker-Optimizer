import type { StateCreator } from 'zustand'

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

export interface HorizontalNavState {
  isBreakpointReached?: boolean
}

export interface NavigationSlice {
  verticalNav: VerticalNavState
  updateVerticalNavState: (values: Partial<VerticalNavState>) => void
  collapseVerticalNav: (value?: boolean) => void
  hoverVerticalNav: (value?: boolean) => void
  toggleVerticalNav: (value?: boolean) => void

  horizontalNav: HorizontalNavState
  updateIsBreakpointReached: (isBreakpointReached: boolean) => void
}

export const createNavigationSlice: StateCreator<
  NavigationSlice,
  [['zustand/immer', never], ['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  NavigationSlice
> = (set) => ({
  verticalNav: {},

  updateVerticalNavState: (values: Partial<VerticalNavState>) => {
    set((state) => ({
      verticalNav: {
        ...state.verticalNav,
        ...values,
        collapsing: values.isCollapsed === true,
        expanding: values.isCollapsed === false,
      },
    }))
  },

  collapseVerticalNav: (value?: boolean) => {
    set((state) => ({
      verticalNav: {
        ...state.verticalNav,
        isHovered: value !== undefined && false,
        isCollapsed: value !== undefined ? Boolean(value) : !Boolean(state.verticalNav.isCollapsed),
        collapsing: value === true,
        expanding: value !== true,
      },
    }))
  },

  hoverVerticalNav: (value?: boolean) => {
    set((state) => ({
      verticalNav: {
        ...state.verticalNav,
        isHovered: value !== undefined ? Boolean(value) : !Boolean(state.verticalNav.isHovered),
      },
    }))
  },

  toggleVerticalNav: (value?: boolean) => {
    set((state) => ({
      verticalNav: {
        ...state.verticalNav,
        isToggled: value !== undefined ? Boolean(value) : !Boolean(state.verticalNav.isToggled),
      },
    }))
  },

  horizontalNav: {
    isBreakpointReached: false,
  },

  updateIsBreakpointReached: (isBreakpointReached: boolean) => {
    set((state) => ({
      horizontalNav: {
        ...state.horizontalNav,
        isBreakpointReached,
      },
    }))
  },
})
