import React from 'react'
import { deepmerge } from '@mui/utils'
import {
  CssVarsProvider,
  extendTheme,
  lighten,
  darken,
} from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import type { } from '@mui/material/themeCssVarsAugmentation' //! Do not remove this import otherwise you will get type errors while making a production build
import type { } from '@mui/lab/themeAugmentation' //! Do not remove this import otherwise you will get type errors while making a production build
import { useMedia } from 'react-use'
import type { ChildrenType, Direction, SystemMode } from 'src/types'
import ModeChanger from './ModeChanger'
import themeConfig from 'src/configs/themeConfig'
import { useSettings } from 'src/core/contexts/settingsContext'
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
    const newColorScheme = {
      colorSchemes: {
        light: {
          palette: {
            primary: {
              main: settings.primaryColor,
              light: lighten(settings.primaryColor as string, 0.2),
              dark: darken(settings.primaryColor as string, 0.1),
            },
          },
        },
        dark: {
          palette: {
            primary: {
              main: settings.primaryColor,
              light: lighten(settings.primaryColor as string, 0.2),
              dark: darken(settings.primaryColor as string, 0.1),
            },
          },
        },
      },
      // CRITICAL: Configure color scheme selector at theme level
      cssVarPrefix: 'mui',
      colorSchemeSelector: 'class',
      defaultColorScheme: currentMode,
    }

    const coreTheme = deepmerge(
      defaultCoreTheme(settings, currentMode, direction),
      newColorScheme,
    )

    return extendTheme(coreTheme)
  }, [settings.primaryColor, settings.skin, currentMode, settings, direction])

  return (
    <CssVarsProvider
      theme={theme}
      modeStorageKey={`${themeConfig.templateName
        .toLowerCase()
        .split(' ')
        .join('-')}-mui-template-mode`}
    >
      <>
        <ModeChanger />
        <CssBaseline />
        {children}
      </>
    </CssVarsProvider>
  )
}

export default ThemeProvider
