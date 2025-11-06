# Theme Architecture Diagram

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Theme Configuration Flow                     │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────┐
                    │   themeConfig.ts        │
                    │  (Source of Truth)      │
                    │                         │
                    │  ├─ colors              │
                    │  │  ├─ primary          │
                    │  │  ├─ secondary        │
                    │  │  ├─ error            │
                    │  │  ├─ success          │
                    │  │  ├─ warning          │
                    │  │  ├─ info             │
                    │  │  └─ brand colors     │
                    │  ├─ shape               │
                    │  ├─ layout              │
                    │  └─ settings            │
                    └─────────────────────────┘
                              │
                              │ imports
                              ▼
         ┌────────────────────────────────────────┐
         │     Core Theme Implementation          │
         └────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ colorSchemes.ts │  │   index.ts      │  │  overrides/*    │
│                 │  │                 │  │                 │
│ Uses:           │  │ Uses:           │  │ Uses:           │
│ ├─ colors.*     │  │ ├─ shape        │  │ ├─ disableRipple│
│ └─ brandColors  │  │ └─ spacing      │  │ └─ colors.*     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │ generates
                              ▼
                    ┌─────────────────────────┐
                    │   MUI Theme Object      │
                    │                         │
                    │  ├─ palette (light)     │
                    │  ├─ palette (dark)      │
                    │  ├─ shape               │
                    │  ├─ components          │
                    │  └─ shadows             │
                    └─────────────────────────┘
                              │
                              │ used by
                              ▼
         ┌────────────────────────────────────────┐
         │        ThemeProvider Wrapper           │
         │     (components/theme/index.tsx)       │
         └────────────────────────────────────────┘
                              │
                              │ provides theme to
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Application Components                       │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Layouts    │  │     Pages    │  │  Components  │         │
│  │              │  │              │  │              │         │
│  │ • Vertical   │  │ • Dashboard  │  │ • Buttons    │         │
│  │ • Horizontal │  │ • Auth       │  │ • Cards      │         │
│  │ • Blank      │  │ • Modules    │  │ • Dialogs    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  Access theme via:                                              │
│  • const theme = useTheme()                                     │
│  • theme.palette.primary.main                                   │
│  • themeConfig.colors.brandGold                                 │
│  • themeConfig.shape.customBorderRadius.md                      │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

```
User Modifies themeConfig.ts
         │
         ├──→ Colors change
         │      └──→ colorSchemes.ts updates
         │            └──→ Light/Dark palettes regenerate
         │                  └──→ Components re-render with new colors
         │
         ├──→ Shape changes
         │      └──→ index.ts updates
         │            └──→ Component border radius updates
         │
         └──→ Layout changes
                └──→ Layout components update
                      └──→ Navbar, Footer, Content adjust
```

## 🎨 Color Application Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Color Definition                           │
└──────────────────────────────────────────────────────────────┘

themeConfig.colors.primary.main = "#D4AF37"
         │
         ├──→ Light Theme
         │    └──→ palette.primary.main = themeConfig.colors.primary.main
         │         palette.primary.light = themeConfig.colors.primary.light
         │         palette.primary.dark = themeConfig.colors.primary.dark
         │
         └──→ Dark Theme
              └──→ palette.primary.main = themeConfig.colors.primary.main
                   palette.primary.light = themeConfig.colors.primary.light
                   palette.primary.dark = themeConfig.colors.primary.dark

Components access via:
├─ theme.palette.primary.main       (mode-aware, from useTheme())
└─ themeConfig.colors.primary.main  (static, direct import)
```

## 📂 File Structure

```
client/
│
├── src/
│   │
│   ├── configs/
│   │   └── themeConfig.ts ⭐ SINGLE SOURCE OF TRUTH
│   │
│   ├── core/
│   │   ├── theme/
│   │   │   ├── index.ts                  (Theme factory)
│   │   │   ├── colorSchemes.ts           (Color implementation)
│   │   │   ├── spacing.ts                (Spacing system)
│   │   │   ├── shadows.ts                (Shadow definitions)
│   │   │   ├── customShadows.ts          (Custom shadows)
│   │   │   └── overrides/                (35 component overrides)
│   │   │       ├── index.ts
│   │   │       ├── button.ts
│   │   │       ├── chip.ts
│   │   │       ├── card.ts
│   │   │       └── ...
│   │   │
│   │   └── contexts/
│   │       └── settingsContext.tsx       (Theme settings provider)
│   │
│   ├── components/
│   │   └── theme/
│   │       ├── index.tsx                 (ThemeProvider wrapper)
│   │       └── ModeChanger.tsx           (Light/Dark switcher)
│   │
│   ├── layouts/
│   │   ├── components/                   (Layout-specific components)
│   │   └── styles/                       (Styled components)
│   │
│   └── Providers.tsx                     (Root provider setup)
│
└── THEME_CONFIG_GUIDE.md                 (Documentation)
```

## 🔧 Component Override System

```
┌──────────────────────────────────────────────────────────────┐
│              MUI Component Customization                      │
└──────────────────────────────────────────────────────────────┘

themeConfig.ts
    │
    └──→ overrides/button.ts
         │  Uses:
         │  • themeConfig.disableRipple
         │  • Palette colors (inherited from theme)
         │
         └──→ MuiButton override
              │  Customizes:
              │  • Default props
              │  • Style overrides
              │  • Variant styles
              │
              └──→ Applied to all <Button> components
                   • Automatic styling
                   • Consistent behavior
                   • Theme-aware colors
```

## 🌓 Light/Dark Mode System

```
┌──────────────────────────────────────────────────────────────┐
│                Mode Switching Architecture                    │
└──────────────────────────────────────────────────────────────┘

User clicks theme toggle
    │
    ├──→ ModeChanger component
    │    └──→ Updates settings context
    │         └──→ Changes mode: 'light' | 'dark' | 'system'
    │
    └──→ ThemeProvider re-renders
         │
         ├──→ Light Mode
         │    └──→ colorSchemes.light
         │         • Background: #FDFDFD
         │         • Text: #333333
         │         • Primary: themeConfig.colors.primary.*
         │
         └──→ Dark Mode
              └──→ colorSchemes.dark
                   • Background: #1A1A1A
                   • Text: #F8F8F8
                   • Primary: themeConfig.colors.primary.*
                   • Info: #4A6A6A (lighter for visibility)
```

## 🎯 Usage Patterns

### ✅ Recommended

```typescript
// Pattern 1: Use theme for mode-aware colors
import { useTheme } from '@mui/material/styles'

const theme = useTheme()
<Box sx={{ color: theme.palette.primary.main }} />

// Pattern 2: Use themeConfig for static values
import themeConfig from 'src/configs/themeConfig'

<Box sx={{ 
  borderRadius: themeConfig.shape.customBorderRadius.md,
  color: themeConfig.colors.brandGold 
}} />
```

### ❌ Avoid

```typescript
// ❌ Don't hardcode colors
<Box sx={{ color: '#D4AF37' }} />

// ❌ Don't hardcode border radius
<Box sx={{ borderRadius: '6px' }} />

// ❌ Don't create duplicate color definitions
const PRIMARY_COLOR = '#D4AF37' // ❌ Already in themeConfig!
```

## 📊 Configuration Hierarchy

```
Level 1: themeConfig.ts
    ├─ Global settings
    ├─ Color definitions
    ├─ Shape configuration
    └─ Layout parameters
         │
         ▼
Level 2: Core Theme Implementation
    ├─ colorSchemes.ts (transforms colors for light/dark)
    ├─ index.ts (assembles complete theme)
    └─ overrides/* (applies to MUI components)
         │
         ▼
Level 3: Theme Provider
    └─ Distributes theme to app
         │
         ▼
Level 4: Components
    └─ Consume theme via useTheme() or themeConfig import
```

## 🚀 Extension Points

To extend the theme system:

```
1. Add new color → themeConfig.colors.*
2. Add new shape → themeConfig.shape.*
3. Add new layout → themeConfig.layout*
4. Add component override → core/theme/overrides/[component].ts
5. Add custom shadow → core/theme/customShadows.ts
```

---

**Legend:**
- ⭐ Primary configuration file
- → Data flow direction
- ├─ Includes/Contains
- └─ Leads to/Results in
