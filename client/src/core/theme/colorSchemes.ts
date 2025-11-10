import type { Skin } from 'src/types'
import themeConfig from 'src/configs/themeConfig'

/**
 * God Lion Seeker Optimizer - Theme Color Schemes
 * 
 * Primary Palette (Inspired by the logo):
 * - Gold Accent: #D4AF37 (Metallic Gold)
 * - Lion Brown: #8B4513 (Saddle Brown)
 * - Deep Blue/Grey: #2F4F4F (Dark Slate Gray)
 * - Off-White/Cream: #F5F5DC (Beige)
 * - Dark Contrast: #1A1A1A (Very Dark Gray/Near Black)
 * 
 * Light Theme: Clean, airy, readable
 * Dark Theme: Sophisticated, comfortable, low-light friendly
 */

type ColorScheme = {
  palette: Record<string, any>
}

type ColorSchemes = {
  light: ColorScheme
  dark: ColorScheme
}

const colorSchemes = (_skin: Skin): ColorSchemes => {
  return {
    light: {
      palette: {
        // Primary: Metallic Gold - Buttons, active states, key icons
        primary: {
          main: themeConfig.colors.primary.main,
          light: themeConfig.colors.primary.light,
          dark: themeConfig.colors.primary.dark,
          contrastText: themeConfig.colors.primary.contrastText,
          lighterOpacity: 'rgb(212 175 55 / 0.08)',
          lightOpacity: 'rgb(212 175 55 / 0.16)',
          mainOpacity: 'rgb(212 175 55 / 0.24)',
          darkOpacity: 'rgb(212 175 55 / 0.32)',
          darkerOpacity: 'rgb(212 175 55 / 0.38)',
        },
        // Secondary: Saddle Brown - Subtle highlights, specific icons
        secondary: {
          main: themeConfig.colors.secondary.main,
          light: themeConfig.colors.secondary.light,
          dark: themeConfig.colors.secondary.dark,
          contrastText: themeConfig.colors.secondary.contrastText,
          lighterOpacity: 'rgb(139 69 19 / 0.08)',
          lightOpacity: 'rgb(139 69 19 / 0.16)',
          mainOpacity: 'rgb(139 69 19 / 0.24)',
          darkOpacity: 'rgb(139 69 19 / 0.32)',
          darkerOpacity: 'rgb(139 69 19 / 0.38)',
        },
        // Error: Red for errors
        error: {
          main: themeConfig.colors.error.main,
          light: themeConfig.colors.error.light,
          dark: themeConfig.colors.error.dark,
          contrastText: themeConfig.colors.error.contrastText,
          lighterOpacity: 'rgb(220 53 69 / 0.08)',
          lightOpacity: 'rgb(220 53 69 / 0.16)',
          mainOpacity: 'rgb(220 53 69 / 0.24)',
          darkOpacity: 'rgb(220 53 69 / 0.32)',
          darkerOpacity: 'rgb(220 53 69 / 0.38)',
        },
        // Success: Green for success states
        success: {
          main: themeConfig.colors.success.main,
          light: themeConfig.colors.success.light,
          dark: themeConfig.colors.success.dark,
          contrastText: themeConfig.colors.success.contrastText,
          lighterOpacity: 'rgb(40 167 69 / 0.08)',
          lightOpacity: 'rgb(40 167 69 / 0.16)',
          mainOpacity: 'rgb(40 167 69 / 0.24)',
          darkOpacity: 'rgb(40 167 69 / 0.32)',
          darkerOpacity: 'rgb(40 167 69 / 0.38)',
        },
        // Warning: Amber for warnings
        warning: {
          main: themeConfig.colors.warning.main,
          light: themeConfig.colors.warning.light,
          dark: themeConfig.colors.warning.dark,
          contrastText: themeConfig.colors.warning.contrastText,
          lighterOpacity: 'rgb(255 159 67 / 0.08)',
          lightOpacity: 'rgb(255 159 67 / 0.16)',
          mainOpacity: 'rgb(255 159 67 / 0.24)',
          darkOpacity: 'rgb(255 159 67 / 0.32)',
          darkerOpacity: 'rgb(255 159 67 / 0.38)',
        },
        // Info: Cyan for informational states
        info: {
          main: themeConfig.colors.info.main,
          light: themeConfig.colors.info.light,
          dark: themeConfig.colors.info.dark,
          contrastText: themeConfig.colors.info.contrastText,
          lighterOpacity: 'rgb(47 79 79 / 0.08)',
          lightOpacity: 'rgb(47 79 79 / 0.16)',
          mainOpacity: 'rgb(47 79 79 / 0.24)',
          darkOpacity: 'rgb(47 79 79 / 0.32)',
          darkerOpacity: 'rgb(47 79 79 / 0.38)',
        },
        // Text colors for light theme
        text: {
          primary: '#333333',
          secondary: '#6C757D',
          disabled: 'rgba(51, 51, 51, 0.4)',
          primaryChannel: '51 51 51',
          secondaryChannel: '108 117 125',
        },
        // Divider color
        divider: '#E0E0E0',
        dividerChannel: '224 224 224',
        // Background colors
        background: {
          default: '#FFFFFF',
          paper: '#FFFFFF',
          paperChannel: '255 255 255',
        },
        // Action states
        action: {
          active: 'rgba(51, 51, 51, 0.6)',
          hover: 'rgba(51, 51, 51, 0.06)',
          selected: 'rgba(212, 175, 55, 0.12)',
          disabled: 'rgba(51, 51, 51, 0.3)',
          disabledBackground: 'rgba(51, 51, 51, 0.12)',
          focus: 'rgba(212, 175, 55, 0.16)',
          focusOpacity: 0.16,
          activeChannel: '51 51 51',
          selectedChannel: '212 175 55',
        },
        // Alert component colors
        Alert: {
          errorColor: themeConfig.colors.error.main,
          warningColor: themeConfig.colors.warning.main,
          infoColor: themeConfig.colors.info.main,
          successColor: themeConfig.colors.success.main,
          errorStandardBg: 'rgba(220, 53, 69, 0.12)',
          warningStandardBg: 'rgba(255, 159, 67, 0.12)',
          infoStandardBg: 'rgba(47, 79, 79, 0.12)',
          successStandardBg: 'rgba(40, 167, 69, 0.12)',
          errorFilledColor: '#FFF',
          warningFilledColor: '#1A1A1A',
          infoFilledColor: '#FFF',
          successFilledColor: '#FFF',
          errorFilledBg: themeConfig.colors.error.main,
          warningFilledBg: themeConfig.colors.warning.main,
          infoFilledBg: themeConfig.colors.info.main,
          successFilledBg: themeConfig.colors.success.main,
        },
        // Avatar component
        Avatar: {
          defaultBg: themeConfig.colors.brandCream,
        },
        // Chip component
        Chip: {
          defaultBorder: '#E0E0E0',
        },
        // FilledInput component
        FilledInput: {
          bg: 'rgba(51, 51, 51, 0.06)',
          hoverBg: 'rgba(51, 51, 51, 0.12)',
          disabledBg: 'rgba(51, 51, 51, 0.06)',
        },
        // SnackbarContent
        SnackbarContent: {
          bg: '#333333',
          color: '#FFFFFF',
        },
        // Switch component
        Switch: {
          defaultColor: '#FFF',
          defaultDisabledColor: '#F5F5F5',
          primaryDisabledColor: 'rgba(212, 175, 55, 0.5)',
          secondaryDisabledColor: 'rgba(139, 69, 19, 0.5)',
          errorDisabledColor: 'rgba(220, 53, 69, 0.5)',
          warningDisabledColor: 'rgba(255, 159, 67, 0.5)',
          infoDisabledColor: 'rgba(47, 79, 79, 0.5)',
          successDisabledColor: 'rgba(40, 167, 69, 0.5)',
        },
        // Tooltip
        Tooltip: {
          bg: '#333333',
        },
        // TableCell
        TableCell: {
          border: '#E0E0E0',
        },
        // Custom colors for specific use cases
        customColors: {
          bodyBg: '#FFFFFF',
          chatBg: '#F8F8F8',
          greyLightBg: '#FAFAFA',
          inputBorder: '#E0E0E0',
          tableHeaderBg: '#F8F8F8',
          tooltipText: '#FFFFFF',
          trackBg: '#F0F0F0',
          brandGold: themeConfig.colors.brandGold,
          brandBrown: themeConfig.colors.brandBrown,
          brandSlate: themeConfig.colors.brandSlate,
          brandCream: themeConfig.colors.brandCream,
        },
      },
    },
    dark: {
      palette: {
        // Primary: Metallic Gold - Buttons, active states, key icons
        primary: {
          main: themeConfig.colors.primary.main,
          light: themeConfig.colors.primary.light,
          dark: themeConfig.colors.primary.dark,
          contrastText: themeConfig.colors.primary.contrastText,
          lighterOpacity: 'rgb(212 175 55 / 0.08)',
          lightOpacity: 'rgb(212 175 55 / 0.16)',
          mainOpacity: 'rgb(212 175 55 / 0.24)',
          darkOpacity: 'rgb(212 175 55 / 0.32)',
          darkerOpacity: 'rgb(212 175 55 / 0.38)',
        },
        // Secondary: Saddle Brown - Subtle highlights, specific icons
        secondary: {
          main: themeConfig.colors.secondary.main,
          light: themeConfig.colors.secondary.light,
          dark: themeConfig.colors.secondary.dark,
          contrastText: '#F8F8F8',
          lighterOpacity: 'rgb(139 69 19 / 0.08)',
          lightOpacity: 'rgb(139 69 19 / 0.16)',
          mainOpacity: 'rgb(139 69 19 / 0.24)',
          darkOpacity: 'rgb(139 69 19 / 0.32)',
          darkerOpacity: 'rgb(139 69 19 / 0.38)',
        },
        // Error: Red for errors
        error: {
          main: themeConfig.colors.error.main,
          light: themeConfig.colors.error.light,
          dark: themeConfig.colors.error.dark,
          contrastText: themeConfig.colors.error.contrastText,
          lighterOpacity: 'rgb(220 53 69 / 0.08)',
          lightOpacity: 'rgb(220 53 69 / 0.16)',
          mainOpacity: 'rgb(220 53 69 / 0.24)',
          darkOpacity: 'rgb(220 53 69 / 0.32)',
          darkerOpacity: 'rgb(220 53 69 / 0.38)',
        },
        // Success: Green for success states
        success: {
          main: themeConfig.colors.success.main,
          light: themeConfig.colors.success.light,
          dark: themeConfig.colors.success.dark,
          contrastText: themeConfig.colors.success.contrastText,
          lighterOpacity: 'rgb(40 167 69 / 0.08)',
          lightOpacity: 'rgb(40 167 69 / 0.16)',
          mainOpacity: 'rgb(40 167 69 / 0.24)',
          darkOpacity: 'rgb(40 167 69 / 0.32)',
          darkerOpacity: 'rgb(40 167 69 / 0.38)',
        },
        // Warning: Amber for warnings
        warning: {
          main: themeConfig.colors.warning.main,
          light: themeConfig.colors.warning.light,
          dark: themeConfig.colors.warning.dark,
          contrastText: themeConfig.colors.warning.contrastText,
          lighterOpacity: 'rgb(255 159 67 / 0.08)',
          lightOpacity: 'rgb(255 159 67 / 0.16)',
          mainOpacity: 'rgb(255 159 67 / 0.24)',
          darkOpacity: 'rgb(255 159 67 / 0.32)',
          darkerOpacity: 'rgb(255 159 67 / 0.38)',
        },
        // Info: Deep slate for informational states
        info: {
          main: '#4A6A6A',
          light: '#6A8A8A',
          dark: themeConfig.colors.info.dark,
          contrastText: '#FFF',
          lighterOpacity: 'rgb(74 106 106 / 0.08)',
          lightOpacity: 'rgb(74 106 106 / 0.16)',
          mainOpacity: 'rgb(74 106 106 / 0.24)',
          darkOpacity: 'rgb(74 106 106 / 0.32)',
          darkerOpacity: 'rgb(74 106 106 / 0.38)',
        },
        // Text colors for dark theme
        text: {
          primary: '#F8F8F8',
          secondary: '#AAAAAA',
          disabled: 'rgba(248, 248, 248, 0.4)',
          primaryChannel: '248 248 248',
          secondaryChannel: '170 170 170',
        },
        // Divider color
        divider: '#333333',
        dividerChannel: '51 51 51',
        // Background colors
        background: {
          default: '#1A1A1A',
          paper: '#1A1A1A',
          paperChannel: '26 26 26',
        },
        // Action states
        action: {
          active: 'rgba(248, 248, 248, 0.6)',
          hover: 'rgba(248, 248, 248, 0.08)',
          selected: 'rgba(212, 175, 55, 0.16)',
          disabled: 'rgba(248, 248, 248, 0.3)',
          disabledBackground: 'rgba(248, 248, 248, 0.12)',
          focus: 'rgba(212, 175, 55, 0.2)',
          focusOpacity: 0.2,
          activeChannel: '248 248 248',
          selectedChannel: '212 175 55',
        },
        // Alert component colors
        Alert: {
          errorColor: themeConfig.colors.error.main,
          warningColor: themeConfig.colors.warning.main,
          infoColor: '#4A6A6A',
          successColor: themeConfig.colors.success.main,
          errorStandardBg: 'rgba(220, 53, 69, 0.16)',
          warningStandardBg: 'rgba(255, 159, 67, 0.16)',
          infoStandardBg: 'rgba(74, 106, 106, 0.16)',
          successStandardBg: 'rgba(40, 167, 69, 0.16)',
          errorFilledColor: '#FFF',
          warningFilledColor: '#1A1A1A',
          infoFilledColor: '#FFF',
          successFilledColor: '#FFF',
          errorFilledBg: themeConfig.colors.error.main,
          warningFilledBg: themeConfig.colors.warning.main,
          infoFilledBg: '#4A6A6A',
          successFilledBg: themeConfig.colors.success.main,
        },
        // Avatar component
        Avatar: {
          defaultBg: '#2F2F2F',
        },
        // Chip component
        Chip: {
          defaultBorder: '#333333',
        },
        // FilledInput component
        FilledInput: {
          bg: 'rgba(248, 248, 248, 0.08)',
          hoverBg: 'rgba(248, 248, 248, 0.12)',
          disabledBg: 'rgba(248, 248, 248, 0.06)',
        },
        // SnackbarContent
        SnackbarContent: {
          bg: '#2A2A2A',
          color: '#F8F8F8',
        },
        // Switch component
        Switch: {
          defaultColor: '#FFF',
          defaultDisabledColor: '#666',
          primaryDisabledColor: 'rgba(212, 175, 55, 0.5)',
          secondaryDisabledColor: 'rgba(139, 69, 19, 0.5)',
          errorDisabledColor: 'rgba(220, 53, 69, 0.5)',
          warningDisabledColor: 'rgba(255, 159, 67, 0.5)',
          infoDisabledColor: 'rgba(74, 106, 106, 0.5)',
          successDisabledColor: 'rgba(40, 167, 69, 0.5)',
        },
        // Tooltip
        Tooltip: {
          bg: '#2A2A2A',
        },
        // TableCell
        TableCell: {
          border: '#333333',
        },
        // Custom colors for specific use cases
        customColors: {
          bodyBg: '#1A1A1A',
          chatBg: '#222222',
          greyLightBg: '#2A2A2A',
          inputBorder: '#333333',
          tableHeaderBg: '#252525',
          tooltipText: '#F8F8F8',
          trackBg: '#2A2A2A',
          brandGold: themeConfig.colors.brandGold,
          brandBrown: themeConfig.colors.brandBrown,
          brandSlate: themeConfig.colors.brandSlate,
          brandCream: themeConfig.colors.brandCream,
        },
      },
    },
  }
}

export default colorSchemes
