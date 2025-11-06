# Theme Configuration Guide

## Overview

The God Lion Seeker Optimizer application uses a centralized theme configuration system that allows all theme-related settings to be managed from a single source of truth: `src/configs/themeConfig.ts`.

## Architecture

### 📁 File Structure

```
client/
├── src/
│   ├── configs/
│   │   └── themeConfig.ts          # ✨ Single source of truth
│   ├── core/
│   │   └── theme/
│   │       ├── index.ts            # Theme factory
│   │       ├── colorSchemes.ts     # Color scheme implementation
│   │       ├── spacing.ts          # Spacing configuration
│   │       ├── shadows.ts          # Shadow definitions
│   │       ├── customShadows.ts    # Custom shadow variants
│   │       └── overrides/          # MUI component overrides
│   └── components/
│       └── theme/
│           └── index.tsx           # Theme provider wrapper
```

## Configuration Reference

### 🎨 Colors (`themeConfig.colors`)

All color values are defined in `themeConfig.colors` and automatically applied to both light and dark themes.

#### Color Palette

| Color      | Hex       | Usage                                      |
|------------|-----------|--------------------------------------------|
| **Primary** |          |                                            |
| `main`     | `#D4AF37` | Primary buttons, active states, key icons  |
| `light`    | `#E0C55B` | Hover states, lighter variants             |
| `dark`     | `#B8982F` | Pressed states, darker variants            |
| **Secondary** |       |                                            |
| `main`     | `#8B4513` | Secondary actions, subtle highlights       |
| `light`    | `#A0522D` | Hover states                               |
| `dark`     | `#6B3410` | Pressed states                             |
| **Error**  |          |                                            |
| `main`     | `#DC3545` | Error messages, destructive actions        |
| `light`    | `#E35D6A` | Error backgrounds                          |
| `dark`     | `#C82333` | Error pressed states                       |
| **Success** |         |                                            |
| `main`     | `#28A745` | Success messages, confirmations            |
| `light`    | `#48B461` | Success backgrounds                        |
| `dark`     | `#1E7E34` | Success pressed states                     |
| **Warning** |         |                                            |
| `main`     | `#FF9F43` | Warning messages, caution alerts           |
| `light`    | `#FFB269` | Warning backgrounds                        |
| `dark`     | `#E68F3C` | Warning pressed states                     |
| **Info**   |          |                                            |
| `main`     | `#2F4F4F` | Informational messages, neutral actions    |
| `light`    | `#4A6A6A` | Info backgrounds                           |
| `dark`     | `#1F3333` | Info pressed states                        |

#### Brand Colors

| Color         | Hex       | Description                               |
|---------------|-----------|-------------------------------------------|
| `brandGold`   | `#D4AF37` | Metallic Gold - Primary brand color       |
| `brandBrown`  | `#8B4513` | Saddle Brown - Secondary brand color      |
| `brandSlate`  | `#2F4F4F` | Dark Slate Gray - Tertiary brand color    |
| `brandCream`  | `#F5F5DC` | Beige - Background/accent color           |

### 🔷 Shape (`themeConfig.shape`)

Border radius values for consistent component styling:

```typescript
shape: {
  borderRadius: 6,              // Default border radius
  customBorderRadius: {
    xs: 2,                      // Extra small elements
    sm: 4,                      // Small elements
    md: 6,                      // Medium elements (default)
    lg: 8,                      // Large elements
    xl: 10,                     // Extra large elements
  }
}
```

### 📐 Layout Configuration

#### General Settings

| Property              | Value         | Description                              |
|-----------------------|---------------|------------------------------------------|
| `templateName`        | `GLDeveloper` | Application template name                |
| `settingsCookieName`  | `GLDeveloper-1` | Cookie name for persisting settings  |
| `mode`                | `system`      | Theme mode: `system`, `light`, `dark`    |
| `skin`                | `default`     | UI skin: `default`, `bordered`           |
| `layout`              | `vertical`    | Layout type: `vertical`, `horizontal`, `collapsed` |
| `layoutPadding`       | `24`          | Padding for layout components (px)       |
| `compactContentWidth` | `1440`        | Max content width in compact mode (px)   |

#### Navbar Settings

| Property        | Value      | Description                                  |
|-----------------|------------|----------------------------------------------|
| `type`          | `fixed`    | `fixed` or `static`                          |
| `contentWidth`  | `compact`  | `compact` or `wide`                          |
| `floating`      | `true`     | Floating navbar (vertical layout only)       |
| `detached`      | `true`     | Detached from top (vertical layout only)     |
| `blur`          | `true`     | Backdrop blur effect                         |

#### Footer Settings

| Property        | Value      | Description                                  |
|-----------------|------------|----------------------------------------------|
| `type`          | `static`   | `fixed` or `static`                          |
| `contentWidth`  | `compact`  | `compact` or `wide`                          |
| `detached`      | `true`     | Detached from bottom (vertical layout only)  |

#### UI Behavior

| Property         | Value        | Description                               |
|------------------|--------------|-------------------------------------------|
| `disableRipple`  | `false`      | Disable Material-UI ripple effects        |
| `toastPosition`  | `top-right`  | Toast notification position               |

## 🎯 Usage Examples

### Accessing Theme Colors in Components

```typescript
import { useTheme } from '@mui/material/styles'
import themeConfig from 'src/configs/themeConfig'

function MyComponent() {
  const theme = useTheme()
  
  // Method 1: Use MUI theme (supports dark/light mode automatically)
  const primaryColor = theme.palette.primary.main
  
  // Method 2: Use themeConfig directly (static values)
  const brandGold = themeConfig.colors.brandGold
  
  return (
    <Box sx={{ 
      backgroundColor: primaryColor,
      color: themeConfig.colors.primary.contrastText,
      borderRadius: themeConfig.shape.customBorderRadius.md
    }}>
      Content
    </Box>
  )
}
```

### Customizing Button with Theme

```typescript
<Button
  variant="contained"
  sx={{
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderRadius: themeConfig.shape.customBorderRadius.lg,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  }}
>
  Click Me
</Button>
```

### Using Brand Colors

```typescript
<Typography
  sx={{
    color: themeConfig.colors.brandGold,
    fontWeight: 'bold',
  }}
>
  God Lion Seeker Optimizer
</Typography>
```

## 🔧 Customization

To modify the theme, edit `client/src/configs/themeConfig.ts`:

### 1. Changing Primary Color

```typescript
colors: {
  primary: {
    main: '#YOUR_COLOR',      // Update main color
    light: '#YOUR_LIGHT',     // Update light variant
    dark: '#YOUR_DARK',       // Update dark variant
    contrastText: '#FFF',     // Update contrast text
  },
  // ...
}
```

### 2. Adjusting Border Radius

```typescript
shape: {
  borderRadius: 8,            // Increase for more rounded corners
  customBorderRadius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 10,
    xl: 12,
  }
}
```

### 3. Changing Layout Padding

```typescript
const themeConfig: Config = {
  // ...
  layoutPadding: 32,          // Increase spacing (default: 24)
  // ...
}
```

## 🌓 Light & Dark Mode

The theme system automatically handles light and dark modes:

- **Light Theme**: Clean, airy, readable with `#FDFDFD` background
- **Dark Theme**: Sophisticated, comfortable with `#1A1A1A` background

Color values from `themeConfig` are automatically applied to both modes with appropriate contrast adjustments in `colorSchemes.ts`.

### Mode-Specific Overrides

Some colors have mode-specific values defined in `colorSchemes.ts`:

```typescript
// Light mode
info: {
  main: themeConfig.colors.info.main,  // #2F4F4F
}

// Dark mode
info: {
  main: '#4A6A6A',  // Lighter variant for better visibility
}
```

## 📦 Component Overrides

All MUI components are styled using the theme system. Overrides are located in `client/src/core/theme/overrides/`.

### Available Override Files

- Accordion, Alert, Autocomplete, Avatar, Backdrop
- Badges, Breadcrumbs, Button, Button Group, Card
- Checkbox, Chip, Dialog, Drawer, FAB
- Form Controls, Icon Buttons, Inputs, Lists, Menus
- Pagination, Paper, Popovers, Progress, Radio
- Rating, Select, Slider, Snackbar, Switch
- Tables, Tabs, Timeline, Toggle Buttons, Tooltips, Typography

## 🚀 Best Practices

1. **Always use `themeConfig`** for color and shape values - avoid hardcoded colors
2. **Use `useTheme()` hook** in components for automatic dark/light mode support
3. **Reference brand colors** for consistent branding across the app
4. **Use shape.customBorderRadius** for border radius values
5. **Test changes** in both light and dark modes

## 🔍 TypeScript Support

The configuration is fully typed with TypeScript:

```typescript
import type { Config } from 'src/configs/themeConfig'

// Type-safe access
const config: Config = themeConfig
const primaryMain: string = config.colors.primary.main
const borderRadius: number = config.shape.borderRadius
```

## 📝 Summary

- **Single Source of Truth**: `src/configs/themeConfig.ts`
- **Centralized Colors**: All colors defined in one place
- **Automatic Theme Support**: Works seamlessly with light/dark modes
- **Type-Safe**: Full TypeScript support
- **Consistent Styling**: Shared across all components
- **Easy Customization**: Change once, applies everywhere

For questions or issues, refer to the main documentation or contact the development team.
