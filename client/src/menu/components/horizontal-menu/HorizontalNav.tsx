import React from 'react'
import classnames from 'classnames'
import type { CSSObject } from '@emotion/styled'
import type { BreakpointType, ChildrenType } from '../../types'
import type { VerticalNavProps } from '../vertical-menu/VerticalNav'
import VerticalNavInHorizontal from './VerticalNavInHorizontal'
import useMediaQuery from '../../hooks/useMediaQuery'
// import useHorizontalNav from '../../hooks/useHorizontalNav'
import { useHorizontalNav } from '../../contexts/horizontalNavContext'

// Util Imports
import { horizontalNavClasses } from '../../utils/menuClasses'

// Styled Component Imports
import StyledHorizontalNav from '../../styles/horizontal/StyledHorizontalNav'

// Default Config Imports
import { defaultBreakpoints } from '../../defaultConfigs'

export type HorizontalNavProps = React.HTMLAttributes<HTMLDivElement> & {
  switchToVertical?: boolean
  hideMenu?: boolean
  breakpoint?: BreakpointType
  customBreakpoint?: string
  breakpoints?: Partial<typeof defaultBreakpoints>
  customStyles?: CSSObject
  verticalNavProps?: Pick<
    VerticalNavProps,
    'width' | 'backgroundColor' | 'backgroundImage' | 'customStyles'
  >
  verticalNavContent?: ({ children }: ChildrenType) => React.JSX.Element

  /**
   * @ignore
   */
  setIsBreakpointReached?: (isBreakpointReached: boolean) => void
}

const HorizontalNav = (props: HorizontalNavProps) => {
  // Props
  const {
    switchToVertical = false,
    hideMenu = false,
    breakpoint = 'lg',
    customBreakpoint,
    breakpoints,
    customStyles,
    className,
    children,
    verticalNavProps,
    verticalNavContent: VerticalNavContent,
  } = props

  // Vars
  const mergedBreakpoints = { ...defaultBreakpoints, ...breakpoints }
  const horizontalMenuClasses = classnames(horizontalNavClasses.root, className)

  // Refs
  const prevBreakpoint = React.useRef(false)

  // Hooks
  const { updateIsBreakpointReached } = useHorizontalNav()

  // Find the breakpoint from which screen size responsive behavior should enable and if its reached or not
  const breakpointReached = useMediaQuery(
    customBreakpoint ??
      (breakpoint ? mergedBreakpoints[breakpoint] : breakpoint),
  )

  // Set the breakpointReached value in the state
  React.useEffect(() => {
    if (prevBreakpoint.current === breakpointReached) return
    updateIsBreakpointReached(breakpointReached)
    prevBreakpoint.current = breakpointReached
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakpointReached])

  // If switchToVertical is true, then render the VerticalNav component if breakpoint is reached
  if (switchToVertical && breakpointReached) {
    return (
      <VerticalNavInHorizontal
        breakpoint={breakpoint}
        className={horizontalMenuClasses}
        customBreakpoint={customBreakpoint}
        verticalNavProps={verticalNavProps}
      >
        {VerticalNavContent && (
          <VerticalNavContent>{children}</VerticalNavContent>
        )}
      </VerticalNavInHorizontal>
    )
  }

  // If hideMenu is true, then hide the HorizontalNav component if breakpoint is reached
  if (hideMenu && breakpointReached) {
    return null
  }

  // If switchToVertical & hideMenu are false, then render the HorizontalNav component
  return (
    <StyledHorizontalNav
      customStyles={customStyles}
      className={horizontalMenuClasses}
    >
      {children}
    </StyledHorizontalNav>
  )
}

export default HorizontalNav
