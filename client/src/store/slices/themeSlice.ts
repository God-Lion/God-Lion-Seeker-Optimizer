
import type { StateCreator } from 'zustand'

export type ThemeMode = 'light' | 'dark'

export interface ThemeSlice {
  mode: ThemeMode
  toggleColorMode: () => void
  setMode: (mode: ThemeMode) => void
}

export const createThemeSlice: StateCreator<
  ThemeSlice,
  [['zustand/immer', never], ['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  ThemeSlice
> = (set) => ({
  mode: 'dark',

  toggleColorMode: () => {
    set((state) => ({
      mode: state.mode === 'light' ? 'dark' : 'light',
    }))
  },

  setMode: (mode: ThemeMode) => {
    set({ mode })
  },
})
