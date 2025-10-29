import React from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import PerfectScrollbar from 'react-perfect-scrollbar'
// import type { getDictionary } from '@/utils/getDictionary'
import type { VerticalMenuContextProps } from 'src/menu/components/vertical-menu/Menu'
import { Menu, SubMenu, MenuItem, MenuSection } from 'src/menu/vertical-menu'

// import { GenerateVerticalMenu } from 'src/components/GenerateMenu'
import { useSettings } from 'src/core/contexts/settingsContext'
import { useVerticalNav } from 'src/menu/contexts/verticalNavContext'
import StyledVerticalNavExpandIcon from 'src/menu/styles/vertical/StyledVerticalNavExpandIcon'
import menuItemStyles from 'src/core/styles/vertical/menuItemStyles'
import menuSectionStyles from 'src/core/styles/vertical/menuSectionStyles'
import { ChevronRight, RadioButtonUnchecked } from '@mui/icons-material'
import Icon from 'src/components/Icon'
import { IMenu } from '../types'

// import adminmenu from 'src/Modules/AdminManagement/menu'

// import providermenu from 'src/Modules/ProviderManagement/menu'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type Props = {
  menu: Array<IMenu>
  dictionary: Record<string, string | object> // Awaited<ReturnType<typeof getDictionary>>
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

const RenderExpandIcon: React.FC<RenderExpandIconProps> = ({
  open,
  transitionDuration,
}) => (
  <StyledVerticalNavExpandIcon
    open={open}
    transitionDuration={transitionDuration}
  >
    <ChevronRight />
  </StyledVerticalNavExpandIcon>
)

// const menuArray: Array<IMenu> = [
//   {
//     name: 'appsPages',
//     // icon: dashboard,
//     link: 'admin/Dashboard',
//     menusection: {
//       name: `APPS & PAGES`,
//       menu: [
//         {
//           name: `Auth Pages`,
//           icon: 'ShieldOutlined',
//           // suffix: (
//           //   <CustomChip label='3' size='small' color='error' round='true' />
//           // ),
//           submenu: [
//             {
//               name: `Login`,
//               // icon: classes,
//               link: `auth/signin`,
//             },
//             {
//               name: `Register`,
//               // icon: classes,
//               link: `auth/signup`,
//             },
//             {
//               name: `Register1`,
//               // icon: classes,
//               link: `auth/signin2`,
//             },
//             {
//               name: `Verify Email`,
//               // icon: classes,
//               link: `auth/verification/email`,
//             },
//             {
//               name: `Forgot Password`,
//               // icon: classes,
//               link: `auth/forget-password`,
//             },
//             {
//               name: `Reset Password`,
//               // icon: classes,
//               link: `auth/reset-password`,
//             },
//             // {
//             //   name: `Two Steps`,
//             //   // icon: classes,
//             //   link: `auth/category`,
//             // },
//           ],
//         },
//         // {
//         //   name: `calendar`,
//         //   // icon: classes,
//         //   link: `admin/category`,
//         // },
//         // {
//         //   name: `invoice`,
//         //   // icon: classes,
//         //   suffix: (
//         //     <CustomChip label='3' size='small' color='error' round='true' />
//         //   ),
//         //   submenu: [
//         //     {
//         //       name: `list`,
//         //       // icon: classes,
//         //       link: `admin/category`,
//         //     },
//         //     {
//         //       name: `preview`,
//         //       // icon: classes,
//         //       link: `admin/category`,
//         //     },
//         //   ],
//         // },
//       ],
//     },
//   },
// ]

const renderMenu: React.FC<{
  menu: IMenu
  dictionary: Props['dictionary']
}> = ({ menu, dictionary }) => {
  const navigation = dictionary['navigation'] as Record<string, string>

  if (menu.submenu) {
    return (
      <SubMenu
        key={Math.random()}
        label={navigation[menu.name]}
        icon={<Icon icon={menu.icon as string} />}
        suffix={menu.suffix}
        // style={{
        //   backgroundColor: '#E57373',
        // }}
      >
        {menu.submenu.map((menuItem) =>
          renderMenu({ menu: menuItem, dictionary }),
        )}
      </SubMenu>
    )
  }

  if (menu.menusection) {
    return (
      <MenuSection key={Math.random()} label={menu.menusection.name}>
        {!Array.isArray(menu.menusection.menu) ? (
          <MenuItem
            component={<Link to={menu.menusection.menu?.link as string} />}
            // icon={menu.menusection.menu.icon}
            icon={<Icon icon={menu.menusection.menu.icon as string} />}
            suffix={menu.menusection.menu.suffix}
          >
            {navigation[menu.menusection.menu.name]}
          </MenuItem>
        ) : (
          menu.menusection.menu.map((subMenu) =>
            renderMenu({ menu: subMenu, dictionary }),
          )
        )}
      </MenuSection>
    )
  }

  return (
    <MenuItem
      key={Math.random()}
      component={<Link to={menu?.link as string} />}
      icon={<Icon icon={menu.icon as string} />}
      suffix={menu.suffix}
      style={{
        backgroundColor: '#8E24AA',
      }}
    >
      {navigation[menu.name]}
    </MenuItem>
  )
}

const VerticalMenu: React.FC<Props> = ({ dictionary, menu, scrollMenu }) => {
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const { settings } = useSettings()
  // const params = useParams()
  const { isBreakpointReached } = useVerticalNav()
  const { transitionDuration } = verticalNavOptions

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    // eslint-disable-next-line lines-around-comment
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            // className: 'bs-full overflow-y-auto overflow-x-hidden',
            style: {
              blockSize: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
            },
            onScroll: (container) => scrollMenu(container, false),
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: (container) => scrollMenu(container, true),
          })}
    >
      <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme, settings)}
        renderExpandIcon={({ open }: { open: boolean }) => (
          <RenderExpandIcon
            open={open}
            transitionDuration={transitionDuration}
          />
        )}
        renderExpandedMenuItemIcon={{
          icon: (
            <RadioButtonUnchecked
              sx={{
                fontSize: '1.25rem',
                lineHeight: '1.75rem',
              }}
              // className='text-xl'
            />
          ), //<i className='tabler-circle text-xs' />,
        }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        {/* {[...adminmenu, ...providermenu, ...menuArray] */}
        {menu.map((menuItem) => renderMenu({ menu: menuItem, dictionary }))}
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
