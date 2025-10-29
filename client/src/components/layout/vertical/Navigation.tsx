import React from 'react'
import { styled, useColorScheme, useTheme } from '@mui/material/styles'
// import type { getDictionary } from '@/utils/getDictionary'
import type { Mode, SystemMode } from 'src/lib/types'
import VerticalNav, {
  NavHeader,
  NavCollapseIcons,
} from 'src/menu/vertical-menu'
import VerticalMenu from './VerticalMenu'
import Logo from 'src/components/layout/shared/Logo'
import { useVerticalNav } from 'src/menu/contexts/verticalNavContext'
import { useSettings } from 'src/core/contexts/settingsContext'
import navigationCustomStyles from 'src/core/styles/vertical/navigationCustomStyles'
import {
  Close,
  RadioButtonChecked,
  RadioButtonUnchecked,
} from '@mui/icons-material'
import { IMenu } from '../types'
// import { useNavigate } from 'react-router-dom'

const StyledBoxForShadow = styled('div')(({ theme }) => ({
  top: 60,
  left: -8,
  zIndex: 2,
  opacity: 0,
  position: 'absolute',
  pointerEvents: 'none',
  width: 'calc(100% + 15px)',
  height: theme.mixins.toolbar.minHeight,
  transition: 'opacity .15s ease-in-out',
  background: `linear-gradient(var(--mui-palette-background-paper) ${
    theme.direction === 'rtl' ? '95%' : '5%'
  }, rgb(var(--mui-palette-background-paperChannel) / 0.85) 30%, rgb(var(--mui-palette-background-paperChannel) / 0.5) 65%, rgb(var(--mui-palette-background-paperChannel) / 0.3) 75%, transparent)`,
  '&.scrolled': {
    opacity: 1,
  },
}))

const Navigation: React.FC<{
  dictionary: Record<string, string | object> // Awaited<ReturnType<typeof getDictionary>>
  menu: Array<IMenu>
  mode: Mode
  systemMode: SystemMode
}> = ({ dictionary, menu, mode, systemMode }) => {
  // const navigate = useNavigate()

  const theme = useTheme()
  const { mode: muiMode, systemMode: muiSystemMode } = useColorScheme()
  const verticalNavOptions = useVerticalNav()
  const { updateSettings, settings } = useSettings()
  const shadowRef = React.useRef(null)
  const { isCollapsed, isHovered, collapseVerticalNav, isBreakpointReached } =
    verticalNavOptions
  const isServer = typeof window === 'undefined'
  const isSemiDark = settings.semiDark
  let isDark

  if (isServer)
    isDark = mode === 'system' ? systemMode === 'dark' : mode === 'dark'
  else
    isDark =
      muiMode === 'system' ? muiSystemMode === 'dark' : muiMode === 'dark'

  const scrollMenu = (container: any, isPerfectScrollbar: boolean) => {
    container =
      isBreakpointReached || !isPerfectScrollbar ? container.target : container

    if (shadowRef && container.scrollTop > 0) {
      // @ts-ignore
      if (!shadowRef.current.classList.contains('scrolled')) {
        // @ts-ignore
        shadowRef.current.classList.add('scrolled')
      }
    } else {
      // @ts-ignore
      shadowRef.current.classList.remove('scrolled')
    }
  }

  React.useEffect(() => {
    if (settings.layout === 'collapsed') collapseVerticalNav(true)
    else collapseVerticalNav(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.layout])

  return (
    // eslint-disable-next-line lines-around-comment
    // Sidebar Vertical Menu
    <VerticalNav
      customStyles={navigationCustomStyles(verticalNavOptions, theme)}
      collapsedWidth={71}
      backgroundColor='var(--mui-palette-background-paper)'
      // backgroundColor='#6A1B9A'
      // eslint-disable-next-line lines-around-comment
      // The following condition adds the data-mui-color-scheme='dark' attribute to the VerticalNav component
      // when semiDark is enabled and the mode or systemMode is light
      {...(isSemiDark &&
        !isDark && {
          'data-mui-color-scheme': 'dark',
        })}
    >
      {/* Nav Header including Logo & nav toggle icons  */}
      <NavHeader>
        <Logo />
        {!(isCollapsed && !isHovered) && (
          <NavCollapseIcons
            lockedIcon={
              <RadioButtonChecked
                sx={{
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem',
                }}
                // className='text-xl'
              />
            }
            unlockedIcon={
              <RadioButtonUnchecked
                sx={{
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem',
                }}
                // className='text-xl'
              />
            }
            closeIcon={
              <Close
                sx={{
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem',
                }}
                // className='text-xl'
              />
            }
            onClick={() =>
              updateSettings({
                layout: !isCollapsed ? 'collapsed' : 'vertical',
              })
            }
          />
        )}
      </NavHeader>
      <StyledBoxForShadow ref={shadowRef} />
      <VerticalMenu
        dictionary={dictionary}
        menu={menu}
        scrollMenu={scrollMenu}
      />
    </VerticalNav>
  )
}

export default Navigation
