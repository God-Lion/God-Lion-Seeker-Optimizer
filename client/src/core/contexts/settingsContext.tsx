/**
 * Settings Context - Backward Compatibility Layer
 * 
 * This file now re-exports Zustand hooks for backward compatibility.
 * All new code should import directly from 'src/store'
 * 
 * @deprecated Use `import { useSettings } from 'src/store'` instead
 */

import React from 'react'
import type { Mode, Skin, Layout, LayoutComponentWidth } from '../types'
import { useSettings as useZustandSettings } from 'src/store'
import themeConfig from 'src/configs/themeConfig'
import primaryColorConfig from 'src/configs/primaryColorConfig'
import { useObjectCookie } from 'src/hooks'

export type Settings = {
  mode?: Mode
  skin?: Skin
  semiDark?: boolean
  layout?: Layout
  navbarContentWidth?: LayoutComponentWidth
  contentWidth?: LayoutComponentWidth
  footerContentWidth?: LayoutComponentWidth
  primaryColor?: string
}

// UpdateSettingsOptions type
type UpdateSettingsOptions = {
  updateCookie?: boolean
}

// SettingsContextProps type
type SettingsContextProps = {
  settings: Settings
  updateSettings: (
    settings: Partial<Settings>,
    options?: UpdateSettingsOptions,
  ) => void
  isSettingsChanged: boolean
  resetSettings: () => void
  updatePageSettings: (settings: Partial<Settings>) => () => void
}

// Initial Settings Context (kept for backward compatibility)
export const SettingsContext = React.createContext<SettingsContextProps | null>(
  null,
)

export const SettingsProvider: React.FC<{
  children: React.ReactNode
  settingsCookie: Settings | null
  mode?: Mode
}> = (props) => {
  const initialSettings: Settings = {
    mode: themeConfig.mode,
    skin: themeConfig.skin,
    semiDark: themeConfig.semiDark,
    layout: themeConfig.layout,
    navbarContentWidth: themeConfig.navbar.contentWidth,
    contentWidth: themeConfig.contentWidth,
    footerContentWidth: themeConfig.footer.contentWidth,
    primaryColor: primaryColorConfig[0].main,
  }

  const updatedInitialSettings = {
    ...initialSettings,
    mode: props.mode || themeConfig.mode,
  }

  // Cookies
  const [settingsCookie, updateSettingsCookie] = useObjectCookie<Settings>(
    themeConfig.settingsCookieName,
    updatedInitialSettings,
  )

  // State
  const [_settingsState, _updateSettingsState] = React.useState<Settings>(
    JSON.stringify(settingsCookie) !== '{}'
      ? settingsCookie
      : updatedInitialSettings,
  )

  const updateSettings = (
    settings: Partial<Settings>,
    options?: UpdateSettingsOptions,
  ) => {
    const { updateCookie = true } = options || {}
    _updateSettingsState((prev) => {
      const newSettings = { ...prev, ...settings }
      // Update cookie if needed
      if (updateCookie) updateSettingsCookie(newSettings)
      return newSettings
    })
  }

  /**
   * Updates the settings for page with the provided settings object.
   * Updated settings won't be saved to cookie hence will be reverted once navigating away from the page.
   *
   * @param settings - The partial settings object containing the properties to update.
   * @returns A function to reset the page settings.
   *
   * @example
   * useEffect(() => {
   *     return updatePageSettings({ theme: 'dark' });
   * }, []);
   */
  const updatePageSettings = (settings: Partial<Settings>): (() => void) => {
    updateSettings(settings, { updateCookie: false })

    // Returns a function to reset the page settings
    return () => updateSettings(settingsCookie, { updateCookie: false })
  }

  const resetSettings = () => {
    updateSettings(initialSettings)
  }

  const isSettingsChanged = React.useMemo(
    () => JSON.stringify(initialSettings) !== JSON.stringify(_settingsState),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [_settingsState],
  )

  return (
    <SettingsContext.Provider
      value={{
        settings: _settingsState,
        updateSettings,
        isSettingsChanged,
        resetSettings,
        updatePageSettings,
      }}
    >
      {props.children}
    </SettingsContext.Provider>
  )
}

/**
 * @deprecated Use `import { useSettings } from 'src/store'` instead
 * 
 * This hook now uses Zustand internally for backward compatibility
 */
export const useSettings = () => {
  // Use Zustand store directly
  const zustandSettings = useZustandSettings()
  
  // Wrap updateSettings to handle the updateCookie option (ignored in Zustand)
  const updateSettings = (settings: Partial<Settings>) => {
    zustandSettings.updateSettings(settings)
  }
  
  return {
    settings: zustandSettings.settings,
    updateSettings,
    isSettingsChanged: zustandSettings.isSettingsChanged,
    resetSettings: zustandSettings.resetSettings,
    updatePageSettings: zustandSettings.updatePageSettings,
  }
}

export default SettingsProvider
