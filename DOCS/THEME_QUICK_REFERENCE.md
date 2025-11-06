# Theme Quick Reference Card

## 🎨 Color Access

### Primary Colors
```typescript
import themeConfig from 'src/configs/themeConfig'

themeConfig.colors.primary.main        // #D4AF37 (Gold)
themeConfig.colors.primary.light       // #E0C55B
themeConfig.colors.primary.dark        // #B8982F
themeConfig.colors.primary.contrastText // #1A1A1A
```

### All Available Colors
| Property | Color | Hex |
|----------|-------|-----|
| `primary.main` | Gold | #D4AF37 |
| `secondary.main` | Brown | #8B4513 |
| `error.main` | Red | #DC3545 |
| `success.main` | Green | #28A745 |
| `warning.main` | Amber | #FF9F43 |
| `info.main` | Slate | #2F4F4F |

### Brand Colors
```typescript
themeConfig.colors.brandGold   // #D4AF37
themeConfig.colors.brandBrown  // #8B4513
themeConfig.colors.brandSlate  // #2F4F4F
themeConfig.colors.brandCream  // #F5F5DC
```

## 🔷 Shape Access

### Border Radius
```typescript
import themeConfig from 'src/configs/themeConfig'

themeConfig.shape.borderRadius                  // 6
themeConfig.shape.customBorderRadius.xs         // 2
themeConfig.shape.customBorderRadius.sm         // 4
themeConfig.shape.customBorderRadius.md         // 6
themeConfig.shape.customBorderRadius.lg         // 8
themeConfig.shape.customBorderRadius.xl         // 10
```

## 🎯 Common Usage Patterns

### Pattern 1: Using Theme Hook (Mode-Aware)
```typescript
import { useTheme } from '@mui/material/styles'

function MyComponent() {
  const theme = useTheme()
  
  return (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        '&:hover': {
          backgroundColor: theme.palette.primary.dark,
        },
      }}
    >
      Content
    </Box>
  )
}
```

### Pattern 2: Using ThemeConfig (Static Values)
```typescript
import themeConfig from 'src/configs/themeConfig'

function MyComponent() {
  return (
    <Box
      sx={{
        borderRadius: themeConfig.shape.customBorderRadius.md,
        padding: themeConfig.layoutPadding,
      }}
    >
      Content
    </Box>
  )
}
```

### Pattern 3: Mixed Approach (Best Practice)
```typescript
import { useTheme } from '@mui/material/styles'
import themeConfig from 'src/configs/themeConfig'

function MyComponent() {
  const theme = useTheme()
  
  return (
    <Box
      sx={{
        // Use theme for colors (supports dark mode)
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        
        // Use themeConfig for static values
        borderRadius: themeConfig.shape.customBorderRadius.lg,
        padding: `${themeConfig.layoutPadding}px`,
        
        // Brand colors from themeConfig
        borderColor: themeConfig.colors.brandGold,
      }}
    >
      Content
    </Box>
  )
}
```

## 🖌️ Styling Examples

### Button with Custom Colors
```typescript
<Button
  variant="contained"
  sx={{
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderRadius: themeConfig.shape.customBorderRadius.md,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  }}
>
  Click Me
</Button>
```

### Card with Brand Colors
```typescript
<Card
  sx={{
    borderRadius: themeConfig.shape.customBorderRadius.lg,
    borderLeft: `4px solid ${themeConfig.colors.brandGold}`,
    '&:hover': {
      borderLeftColor: themeConfig.colors.brandBrown,
    },
  }}
>
  <CardContent>
    Content
  </CardContent>
</Card>
```

### Typography with Theme Colors
```typescript
<Typography
  sx={{
    color: theme.palette.text.primary,
    fontWeight: 'bold',
    '& .highlight': {
      color: themeConfig.colors.brandGold,
    },
  }}
>
  Text with <span className="highlight">gold</span> accent
</Typography>
```

## 📐 Layout Values

### Spacing & Dimensions
```typescript
themeConfig.layoutPadding          // 24 (px)
themeConfig.compactContentWidth    // 1440 (px)
themeConfig.contentWidth           // 'compact' | 'wide'
```

### Navbar Configuration
```typescript
themeConfig.navbar.type            // 'fixed' | 'static'
themeConfig.navbar.contentWidth    // 'compact' | 'wide'
themeConfig.navbar.floating        // true | false
themeConfig.navbar.detached        // true | false
themeConfig.navbar.blur            // true | false
```

### Footer Configuration
```typescript
themeConfig.footer.type            // 'fixed' | 'static'
themeConfig.footer.contentWidth    // 'compact' | 'wide'
themeConfig.footer.detached        // true | false
```

## ⚙️ Settings

### General Settings
```typescript
themeConfig.templateName           // 'GLDeveloper'
themeConfig.settingsCookieName     // 'GLDeveloper-1'
themeConfig.mode                   // 'system' | 'light' | 'dark'
themeConfig.skin                   // 'default' | 'bordered'
themeConfig.layout                 // 'vertical' | 'horizontal' | 'collapsed'
themeConfig.disableRipple          // true | false
themeConfig.toastPosition          // 'top-right' | 'top-center' | etc.
```

## 🔄 Theme Mode Switching

### Using ModeChanger Component
```typescript
import ModeChanger from 'src/components/theme/ModeChanger'

// Renders a toggle button for light/dark mode
<ModeChanger />
```

### Manual Mode Control
```typescript
import { useSettings } from 'src/core/contexts/settingsContext'

function MyComponent() {
  const { settings, updateSettings } = useSettings()
  
  const toggleMode = () => {
    updateSettings({
      mode: settings.mode === 'light' ? 'dark' : 'light',
    })
  }
  
  return <Button onClick={toggleMode}>Toggle Mode</Button>
}
```

## 🎨 Color Utilities

### Generate Opacity Variants
```typescript
// Pre-defined in colorSchemes.ts
palette.primary.lighterOpacity  // 'rgb(212 175 55 / 0.08)'
palette.primary.lightOpacity    // 'rgb(212 175 55 / 0.16)'
palette.primary.mainOpacity     // 'rgb(212 175 55 / 0.24)'
palette.primary.darkOpacity     // 'rgb(212 175 55 / 0.32)'
palette.primary.darkerOpacity   // 'rgb(212 175 55 / 0.38)'
```

### Using Opacity in Components
```typescript
<Box
  sx={{
    backgroundColor: theme.palette.primary.mainOpacity,
    '&:hover': {
      backgroundColor: theme.palette.primary.darkOpacity,
    },
  }}
>
  Semi-transparent box
</Box>
```

## 📱 Responsive Design

### Using Theme Breakpoints
```typescript
import { useTheme } from '@mui/material/styles'
import { useMediaQuery } from '@mui/material'

function MyComponent() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))
  
  return (
    <Box
      sx={{
        padding: {
          xs: 2,
          sm: 3,
          md: themeConfig.layoutPadding / 8, // Convert px to spacing units
        },
        borderRadius: {
          xs: themeConfig.shape.customBorderRadius.sm,
          md: themeConfig.shape.customBorderRadius.md,
          lg: themeConfig.shape.customBorderRadius.lg,
        },
      }}
    >
      Content
    </Box>
  )
}
```

## 🎯 Best Practices

### ✅ DO
```typescript
// ✅ Use theme for mode-aware colors
color: theme.palette.primary.main

// ✅ Use themeConfig for static values
borderRadius: themeConfig.shape.customBorderRadius.md

// ✅ Use brand colors for branding
color: themeConfig.colors.brandGold

// ✅ Access layout values from themeConfig
padding: themeConfig.layoutPadding
```

### ❌ DON'T
```typescript
// ❌ Don't hardcode colors
color: '#D4AF37'

// ❌ Don't hardcode border radius
borderRadius: '6px'

// ❌ Don't create duplicate color definitions
const GOLD = '#D4AF37'

// ❌ Don't bypass themeConfig
const MY_PADDING = 24
```

## 🔍 Debugging

### Check Current Theme
```typescript
import { useTheme } from '@mui/material/styles'

function DebugTheme() {
  const theme = useTheme()
  
  console.log('Current theme:', theme)
  console.log('Current mode:', theme.palette.mode)
  console.log('Primary color:', theme.palette.primary.main)
  
  return null
}
```

### Inspect ThemeConfig
```typescript
import themeConfig from 'src/configs/themeConfig'

console.log('Theme config:', themeConfig)
console.log('All colors:', themeConfig.colors)
console.log('Shape config:', themeConfig.shape)
```

## 📚 Additional Resources

- **Full Guide**: `client/THEME_CONFIG_GUIDE.md`
- **Architecture**: `DOCS/THEME_ARCHITECTURE.md`
- **Implementation**: `DOCS/THEME_CENTRALIZATION_SUMMARY.md`

---

**Quick Tip**: Always import `themeConfig` for static values and use `useTheme()` for mode-aware colors!
