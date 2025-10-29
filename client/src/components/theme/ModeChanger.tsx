import React from 'react'
import { useMedia } from 'react-use'
import { useSettings } from 'src/core/contexts/settingsContext'

const ModeChanger = () => {
  const { settings } = useSettings()
  const isDark = useMedia('(prefers-color-scheme: dark)', false)

  React.useEffect(() => {
    if (settings.mode) {
      let mode: 'light' | 'dark' = settings.mode === 'system' 
        ? (isDark ? 'dark' : 'light')
        : settings.mode as 'light' | 'dark'
      
      // Remove old color scheme classes
      document.documentElement.classList.remove('light', 'dark')
      
      // Add new color scheme class
      document.documentElement.classList.add(mode)
      
      // Update body color-scheme for better browser defaults
      document.body.style.colorScheme = mode
    }
  }, [settings.mode, isDark])

  return null
}

export default ModeChanger
