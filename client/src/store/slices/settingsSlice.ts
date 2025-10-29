import type { StateCreator } from 'zustand'

export type Mode = 'light' | 'dark' | 'system'
export type Skin = 'default' | 'bordered'
export type Layout = 'vertical' | 'horizontal'
export type LayoutComponentWidth = 'full' | 'boxed'

export interface Settings {
  mode: Mode
  skin: Skin
  semiDark: boolean
  layout: Layout
  navbarContentWidth: LayoutComponentWidth
  contentWidth: LayoutComponentWidth
  footerContentWidth: LayoutComponentWidth
  primaryColor: string
}

export interface SettingsSlice {
  settings: Settings
  isSettingsChanged: boolean
  updateSettings: (settings: Partial<Settings>) => void
  resetSettings: () => void
  updatePageSettings: (settings: Partial<Settings>) => () => void
}

const defaultSettings: Settings = {
  mode: 'dark',
  skin: 'default',
  semiDark: false,
  layout: 'vertical',
  navbarContentWidth: 'full',
  contentWidth: 'boxed',
  footerContentWidth: 'full',
  primaryColor: '#7367F0',
}

export const createSettingsSlice: StateCreator<
  SettingsSlice,
  [['zustand/immer', never], ['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  SettingsSlice
> = (set, get) => ({
  settings: defaultSettings,
  isSettingsChanged: false,

  updateSettings: (newSettings: Partial<Settings>) => {
    set((state) => {
      const updatedSettings = { ...state.settings, ...newSettings }
      return {
        settings: updatedSettings,
        isSettingsChanged: JSON.stringify(defaultSettings) !== JSON.stringify(updatedSettings),
      }
    })
  },

  resetSettings: () => {
    set({
      settings: defaultSettings,
      isSettingsChanged: false,
    })
  },

  updatePageSettings: (newSettings: Partial<Settings>) => {
    const currentSettings = get().settings
    get().updateSettings(newSettings)
    
    return () => {
      set({ settings: currentSettings })
    }
  },
})
