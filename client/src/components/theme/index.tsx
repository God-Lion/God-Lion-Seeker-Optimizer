import React from 'react'
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import type { } from '@mui/lab/themeAugmentation'
import { useMedia } from 'react-use'
import type { ChildrenType, Direction, SystemMode } from 'src/types'
import ModeChanger from './ModeChanger'
import { useSettings } from 'src/store'
import defaultCoreTheme from 'src/core/theme'

const ThemeProvider: React.FC<
  ChildrenType & {
    direction: Direction
    systemMode: SystemMode
  }
> = ({ children, direction, systemMode }) => {
  const { settings } = useSettings()
  const isDark = useMedia('(prefers-color-scheme: dark)', false)
  const isServer = typeof window === 'undefined'
  let currentMode: SystemMode

  if (isServer) currentMode = systemMode
  else {
    if (settings.mode === 'system') currentMode = isDark ? 'dark' : 'light'
    else currentMode = settings.mode as SystemMode
  }

  const theme = React.useMemo(() => {
    const coreThemeConfig = defaultCoreTheme(settings, currentMode, direction)
    
    const modeScheme = coreThemeConfig.colorSchemes?.[currentMode]?.palette || {}
    
    const themeWithPalette = {
      ...coreThemeConfig,
      palette: {
        mode: currentMode,
        ...modeScheme,
      },
    }
    
    return createTheme(themeWithPalette)
  }, [settings, currentMode, direction])

  return (
    <MuiThemeProvider theme={theme}>
      <>
        <ModeChanger />
        <CssBaseline />
        {children}
      </>
    </MuiThemeProvider>
  )
}

export default ThemeProvider
