import type { Theme } from '@mui/material/styles'
import type { VerticalNavState } from 'src/menu/contexts/verticalNavContext'
import type { MenuProps } from 'src/menu/vertical-menu'
import { menuClasses } from 'src/menu/utils/menuClasses'

const menuSectionStyles = (
  verticalNavOptions: VerticalNavState,
  theme: Theme,
): MenuProps['menuSectionStyles'] => {
  const { isCollapsed, isHovered } = verticalNavOptions
  const collapsedNotHovered = isCollapsed && !isHovered

  return {
    root: {
      marginBlockStart: theme.spacing(0),
      [`& .${menuClasses.menuSectionContent}`]: {
        color: 'var(--mui-palette-text-disabled)',
        paddingInline: '12px !important',
        paddingBlock: `${theme.spacing(
          collapsedNotHovered ? 3.625 : 1.5,
        )} !important`,
        marginBlockStart: theme.spacing(1.5),

        '&:before': {
          content: '""',
          blockSize: 1,
          inlineSize: '1.375rem',
          backgroundColor: 'var(--mui-palette-text-disabled)',
        },
        ...(!collapsedNotHovered && {
          '&:before': {
            content: 'none',
          },
        }),

        [`& .${menuClasses.menuSectionLabel}`]: {
          flexGrow: 0,
          textTransform: 'uppercase',
          fontSize: '13px',
          lineHeight: 1.38462,
          letterSpacing: '0.4px',
          ...(collapsedNotHovered && {
            display: 'none',
          }),
        },
      },
    },
  }
}

export default menuSectionStyles
