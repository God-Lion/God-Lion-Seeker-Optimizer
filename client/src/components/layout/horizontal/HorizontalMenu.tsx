import React from 'react'
import {
  Link,
  //, useParams
} from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
// import type { getDictionary } from '@/utils/getDictionary'
import type { VerticalMenuContextProps } from 'src/menu/components/vertical-menu/Menu'

// Component Imports
import HorizontalNav, {
  Menu,
  SubMenu,
  MenuItem,
} from 'src/menu/horizontal-menu'
import VerticalNavContent from './VerticalNavContent'
// import CustomChip from 'src/core/components/mui/Chip'

// import { GenerateHorizontalMenu } from 'src/components/GenerateMenu'

// Hook Imports
import { useVerticalNav } from 'src/menu/contexts/verticalNavContext'
import { useSettings } from 'src/core/contexts/settingsContext'

// Styled Component Imports
import StyledHorizontalNavExpandIcon from 'src/menu/styles/horizontal/StyledHorizontalNavExpandIcon'
import StyledVerticalNavExpandIcon from 'src/menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from 'src/core/styles/horizontal/menuItemStyles'
import menuRootStyles from 'src/core/styles/horizontal/menuRootStyles'
import verticalNavigationCustomStyles from 'src/core/styles/vertical/navigationCustomStyles'
import verticalMenuItemStyles from 'src/core/styles/vertical/menuItemStyles'
import verticalMenuSectionStyles from 'src/core/styles/vertical/menuSectionStyles'
import { ChevronRight, RadioButtonUnchecked } from '@mui/icons-material'
import { IMenu } from '../types'
import adminmenu from 'src/Modules/Admin/menu'


import Icon from 'src/components/Icon'

// Menu Data Imports
// import menuData from '@/data/navigation/horizontalMenuData'
const menuArray: Array<IMenu> = [
  {
    name: 'appsPages',
    // icon: dashboard,
    link: 'admin/Dashboard',
    menusection: {
      name: `APPS & PAGES`,
      menu: [
        {
          name: `Auth Pages`,
          icon: 'ShieldOutlined',
          // suffix: (
          //   <CustomChip label='3' size='small' color='error' round='true' />
          // ),
          submenu: [
            {
              name: `Login`,
              // icon: classes,
              link: `auth/signin`,
            },
            {
              name: `Register`,
              // icon: classes,
              link: `auth/signup`,
            },
            {
              name: `Register1`,
              // icon: classes,
              link: `auth/signin2`,
            },
            {
              name: `Verify Email`,
              // icon: classes,
              link: `auth/verification/email`,
            },
            {
              name: `Forgot Password`,
              // icon: classes,
              link: `auth/forget-password`,
            },
            {
              name: `Reset Password`,
              // icon: classes,
              link: `auth/reset-password`,
            },
            // {
            //   name: `Two Steps`,
            //   // icon: classes,
            //   link: `auth/category`,
            // },
          ],
        },
        // {
        //   name: `calendar`,
        //   // icon: classes,
        //   link: `admin/category`,
        // },
        // {
        //   name: `invoice`,
        //   // icon: classes,
        //   suffix: (
        //     <CustomChip label='3' size='small' color='error' round='true' />
        //   ),
        //   submenu: [
        //     {
        //       name: `list`,
        //       // icon: classes,
        //       link: `admin/category`,
        //     },
        //     {
        //       name: `preview`,
        //       // icon: classes,
        //       link: `admin/category`,
        //     },
        //   ],
        // },
      ],
    },
  },
]

type RenderExpandIconProps = {
  level?: number
}

type RenderVerticalExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

const RenderExpandIcon = ({ level }: RenderExpandIconProps) => (
  <StyledHorizontalNavExpandIcon level={level}>
    <ChevronRight className='tabler-chevron-right' />
  </StyledHorizontalNavExpandIcon>
)

const RenderVerticalExpandIcon = ({
  open,
  transitionDuration,
}: RenderVerticalExpandIconProps) => (
  <StyledVerticalNavExpandIcon
    open={open}
    transitionDuration={transitionDuration}
  >
    <ChevronRight className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

const renderMenu: React.FC<IMenu> = (menu) => {
  if (menu.submenu) {
    return (
      <SubMenu
        label={menu.name}
        icon={<Icon icon={menu.icon as string} />}
        suffix={menu.suffix}
        // style={{
        //   backgroundColor: '#E57373',
        // }}
      >
        {menu.submenu.map(renderMenu)}
      </SubMenu>
    )
  }

  // if (menu.menusection) {
  //   return (
  //     <MenuSection label={menu.menusection.name}>
  //       {!Array.isArray(menu.menusection.menu) ? (
  //         <MenuItem
  //           component={<Link to={menu.menusection.menu?.link as string} />}
  //           // icon={menu.menusection.menu.icon}
  //           icon={<Icon icon={menu.menusection.menu.icon as string} />}
  //           suffix={menu.menusection.menu.suffix}
  //         >
  //           {menu.menusection.menu.name}
  //         </MenuItem>
  //       ) : (
  //         menu.menusection.menu.map((subMenu) => renderMenu(subMenu))
  //       )}
  //     </MenuSection>
  //   )
  // }

  return (
    <MenuItem
      component={<Link to={menu?.link as string} />}
      icon={<Icon icon={menu.icon as string} />}
      suffix={menu.suffix}
      // style={{
      //   backgroundColor: '#8E24AA',
      // }}
    >
      {menu.name}
    </MenuItem>
  )
}

const HorizontalMenu = () =>
  // { dictionary }: { dictionary: Awaited<ReturnType<typeof getDictionary>> }

  {
    const theme = useTheme()
    const verticalNavOptions = useVerticalNav()
    const { settings } = useSettings()
    // const params = useParams()
    const { skin } = settings
    const { transitionDuration } = verticalNavOptions
    // const { lang: locale, id } = params

    return (
      <HorizontalNav
        switchToVertical
        verticalNavContent={VerticalNavContent}
        verticalNavProps={{
          customStyles: verticalNavigationCustomStyles(
            verticalNavOptions,
            theme,
          ),
          backgroundColor:
            skin === 'bordered'
              ? 'var(--mui-palette-background-paper)'
              : 'var(--mui-palette-background-default)',
        }}
      >
        <Menu
          rootStyles={menuRootStyles(theme)}
          renderExpandIcon={({ level }) => <RenderExpandIcon level={level} />}
          menuItemStyles={menuItemStyles(settings, theme)}
          renderExpandedMenuItemIcon={{
            icon: (
              <RadioButtonUnchecked
                sx={{
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem',
                }}
                // className='text-xl'
              />
            ),
            // <i className='tabler-circle text-xs' />,
          }}
          popoutMenuOffset={{
            mainAxis: ({ level }) => (level && level > 0 ? 14 : 12),
            alignmentAxis: 0,
          }}
          verticalMenuProps={{
            menuItemStyles: verticalMenuItemStyles(
              verticalNavOptions,
              theme,
              settings,
            ),
            renderExpandIcon: ({ open }) => (
              <RenderVerticalExpandIcon
                open={open}
                transitionDuration={transitionDuration}
              />
            ),
            renderExpandedMenuItemIcon: {
              icon: (
                <RadioButtonUnchecked
                  sx={{
                    fontSize: '1.25rem',
                    lineHeight: '1.75rem',
                  }}
                  // className='text-xl'
                />
              ),
              // <i className='tabler-circle text-xs' />,
            },
            menuSectionStyles: verticalMenuSectionStyles(
              verticalNavOptions,
              theme,
            ),
          }}
        >
          {[...adminmenu, ...menuArray].map(renderMenu)}
          {/* 
          <SubMenu
            label={dictionary['navigation'].dashboards}
            icon={<i className='tabler-smart-home' />}
          >
            <MenuItem
              href={`/${locale}/dashboards/crm`}
              icon={<i className='tabler-chart-pie-2' />}
            >
              {dictionary['navigation'].crm}
            </MenuItem>
            <MenuItem
              href={`/${locale}/dashboards/analytics`}
              icon={<i className='tabler-trending-up' />}
            >
              {dictionary['navigation'].analytics}
            </MenuItem>
            <MenuItem
              href={`/${locale}/dashboards/ecommerce`}
              icon={<i className='tabler-shopping-cart' />}
            >
              {dictionary['navigation'].eCommerce}
            </MenuItem>
          </SubMenu>
          <SubMenu
            label={dictionary['navigation'].apps}
            icon={<i className='tabler-mail' />}
          >
            <MenuItem
              href={`/${locale}/apps/calendar`}
              icon={<i className='tabler-calendar' />}
            >
              {dictionary['navigation'].calendar}
            </MenuItem>
            <SubMenu
              label={dictionary['navigation'].invoice}
              icon={<i className='tabler-file-description' />}
            >
              <MenuItem href={`/${locale}/apps/invoice/list`}>
                {dictionary['navigation'].list}
              </MenuItem>
              <MenuItem
                href={`/${locale}/apps/invoice/preview/${id || '4987'}`}
              >
                {dictionary['navigation'].preview}
              </MenuItem>
              <MenuItem href={`/${locale}/apps/invoice/edit/${id || '4987'}`}>
                {dictionary['navigation'].edit}
              </MenuItem>
              <MenuItem href={`/${locale}/apps/invoice/add`}>
                {dictionary['navigation'].add}
              </MenuItem>
            </SubMenu>
            <SubMenu
              label={dictionary['navigation'].user}
              icon={<i className='tabler-user' />}
            >
              <MenuItem href={`/${locale}/apps/user/list`}>
                {dictionary['navigation'].list}
              </MenuItem>
              <MenuItem href={`/${locale}/apps/user/view`}>
                {dictionary['navigation'].view}
              </MenuItem>
            </SubMenu>
            <SubMenu
              label={dictionary['navigation'].rolesPermissions}
              icon={<i className='tabler-lock' />}
            >
              <MenuItem href={`/${locale}/apps/roles`}>
                {dictionary['navigation'].roles}
              </MenuItem>
              <MenuItem href={`/${locale}/apps/permissions`}>
                {dictionary['navigation'].permissions}
              </MenuItem>
            </SubMenu>
          </SubMenu>
          <SubMenu
            label={dictionary['navigation'].pages}
            icon={<i className='tabler-file' />}
          >
            <MenuItem
              href={`/${locale}/pages/user-profile`}
              icon={<i className='tabler-user-circle' />}
            >
              {dictionary['navigation'].userProfile}
            </MenuItem>
            <MenuItem
              href={`/${locale}/pages/account-settings`}
              icon={<i className='tabler-settings' />}
            >
              {dictionary['navigation'].accountSettings}
            </MenuItem>
            <MenuItem
              href={`/${locale}/pages/faq`}
              icon={<i className='tabler-help-circle' />}
            >
              {dictionary['navigation'].faq}
            </MenuItem>
            <MenuItem
              href={`/${locale}/pages/pricing`}
              icon={<i className='tabler-currency-dollar' />}
            >
              {dictionary['navigation'].pricing}
            </MenuItem>
            <SubMenu
              label={dictionary['navigation'].miscellaneous}
              icon={<i className='tabler-file-info' />}
            >
              <MenuItem
                href={`/${locale}/pages/misc/coming-soon`}
                target='_blank'
              >
                {dictionary['navigation'].comingSoon}
              </MenuItem>
              <MenuItem
                href={`/${locale}/pages/misc/under-maintenance`}
                target='_blank'
              >
                {dictionary['navigation'].underMaintenance}
              </MenuItem>
              <MenuItem
                href={`/${locale}/pages/misc/404-not-found`}
                target='_blank'
              >
                {dictionary['navigation'].pageNotFound404}
              </MenuItem>
              <MenuItem
                href={`/${locale}/pages/misc/401-not-authorized`}
                target='_blank'
              >
                {dictionary['navigation'].notAuthorized401}
              </MenuItem>
            </SubMenu>
            <SubMenu
              label={dictionary['navigation'].authPages}
              icon={<i className='tabler-shield-lock' />}
            >
              <SubMenu label={dictionary['navigation'].login}>
                <MenuItem
                  href={`/${locale}/pages/auth/login-v1`}
                  target='_blank'
                >
                  {dictionary['navigation'].loginV1}
                </MenuItem>
                <MenuItem
                  href={`/${locale}/pages/auth/login-v2`}
                  target='_blank'
                >
                  {dictionary['navigation'].loginV2}
                </MenuItem>
              </SubMenu>
              <SubMenu label={dictionary['navigation'].register}>
                <MenuItem
                  href={`/${locale}/pages/auth/register-v1`}
                  target='_blank'
                >
                  {dictionary['navigation'].registerV1}
                </MenuItem>
                <MenuItem
                  href={`/${locale}/pages/auth/register-v2`}
                  target='_blank'
                >
                  {dictionary['navigation'].registerV2}
                </MenuItem>
                <MenuItem
                  href={`/${locale}/pages/auth/register-multi-steps`}
                  target='_blank'
                >
                  {dictionary['navigation'].registerMultiSteps}
                </MenuItem>
              </SubMenu>
              <SubMenu label={dictionary['navigation'].verifyEmail}>
                <MenuItem
                  href={`/${locale}/pages/auth/verify-email-v1`}
                  target='_blank'
                >
                  {dictionary['navigation'].verifyEmailV1}
                </MenuItem>
                <MenuItem
                  href={`/${locale}/pages/auth/verify-email-v2`}
                  target='_blank'
                >
                  {dictionary['navigation'].verifyEmailV2}
                </MenuItem>
              </SubMenu>
              <SubMenu label={dictionary['navigation'].forgotPassword}>
                <MenuItem
                  href={`/${locale}/pages/auth/forgot-password-v1`}
                  target='_blank'
                >
                  {dictionary['navigation'].forgotPasswordV1}
                </MenuItem>
                <MenuItem
                  href={`/${locale}/pages/auth/forgot-password-v2`}
                  target='_blank'
                >
                  {dictionary['navigation'].forgotPasswordV2}
                </MenuItem>
              </SubMenu>
              <SubMenu label={dictionary['navigation'].resetPassword}>
                <MenuItem
                  href={`/${locale}/pages/auth/reset-password-v1`}
                  target='_blank'
                >
                  {dictionary['navigation'].resetPasswordV1}
                </MenuItem>
                <MenuItem
                  href={`/${locale}/pages/auth/reset-password-v2`}
                  target='_blank'
                >
                  {dictionary['navigation'].resetPasswordV2}
                </MenuItem>
              </SubMenu>
              <SubMenu label={dictionary['navigation'].twoSteps}>
                <MenuItem
                  href={`/${locale}/pages/auth/two-steps-v1`}
                  target='_blank'
                >
                  {dictionary['navigation'].twoStepsV1}
                </MenuItem>
                <MenuItem
                  href={`/${locale}/pages/auth/two-steps-v2`}
                  target='_blank'
                >
                  {dictionary['navigation'].twoStepsV2}
                </MenuItem>
              </SubMenu>
            </SubMenu>
            <SubMenu
              label={dictionary['navigation'].wizardExamples}
              icon={<i className='tabler-dots' />}
            >
              <MenuItem href={`/${locale}/pages/wizard-examples/checkout`}>
                {dictionary['navigation'].checkout}
              </MenuItem>
              <MenuItem
                href={`/${locale}/pages/wizard-examples/property-listing`}
              >
                {dictionary['navigation'].propertyListing}
              </MenuItem>
              <MenuItem href={`/${locale}/pages/wizard-examples/create-deal`}>
                {dictionary['navigation'].createDeal}
              </MenuItem>
            </SubMenu>
            <MenuItem
              href={`/${locale}/pages/dialog-examples`}
              icon={<i className='tabler-square' />}
            >
              {dictionary['navigation'].dialogExamples}
            </MenuItem>
            <SubMenu
              label={dictionary['navigation'].widgetExamples}
              icon={<i className='tabler-chart-bar' />}
            >
              <MenuItem href={`/${locale}/pages/widget-examples/basic`}>
                {dictionary['navigation'].basic}
              </MenuItem>
              <MenuItem href={`/${locale}/pages/widget-examples/advanced`}>
                {dictionary['navigation'].advanced}
              </MenuItem>
              <MenuItem href={`/${locale}/pages/widget-examples/statistics`}>
                {dictionary['navigation'].statistics}
              </MenuItem>
              <MenuItem href={`/${locale}/pages/widget-examples/charts`}>
                {dictionary['navigation'].charts}
              </MenuItem>
              <MenuItem href={`/${locale}/pages/widget-examples/actions`}>
                {dictionary['navigation'].actions}
              </MenuItem>
            </SubMenu>
          </SubMenu>
          <SubMenu
            label={dictionary['navigation'].formsAndTables}
            icon={<i className='tabler-file-invoice' />}
          >
            <MenuItem
              href={`/${locale}/forms/form-layouts`}
              icon={<i className='tabler-layout' />}
            >
              {dictionary['navigation'].formLayouts}
            </MenuItem>
            <MenuItem
              href={`/${locale}/forms/form-validation`}
              icon={<i className='tabler-checkup-list' />}
            >
              {dictionary['navigation'].formValidation}
            </MenuItem>
            <MenuItem
              href={`/${locale}/forms/form-wizard`}
              icon={<i className='tabler-git-merge' />}
            >
              {dictionary['navigation'].formWizard}
            </MenuItem>
            <MenuItem
              href={`/${locale}/react-table`}
              icon={<i className='tabler-table' />}
            >
              {dictionary['navigation'].reactTable}
            </MenuItem>
            <MenuItem
              icon={<i className='tabler-checkbox' />}
              href={`${process.env.NEXT_PUBLIC_DOCS_URL}/docs/user-interface/form-elements`}
              suffix={<i className='tabler-external-link text-xl' />}
              target='_blank'
            >
              {dictionary['navigation'].formELements}
            </MenuItem>
            <MenuItem
              icon={<i className='tabler-layout-board-split' />}
              href={`${process.env.NEXT_PUBLIC_DOCS_URL}/docs/user-interface/mui-table`}
              suffix={<i className='tabler-external-link text-xl' />}
              target='_blank'
            >
              {dictionary['navigation'].muiTables}
            </MenuItem>
          </SubMenu>
          <SubMenu
            label={dictionary['navigation'].charts}
            icon={<i className='tabler-chart-donut-2' />}
          >
            <MenuItem
              href={`/${locale}/charts/apex-charts`}
              icon={<i className='tabler-chart-ppf' />}
            >
              {dictionary['navigation'].apex}
            </MenuItem>
            <MenuItem
              href={`/${locale}/charts/recharts`}
              icon={<i className='tabler-chart-sankey' />}
            >
              {dictionary['navigation'].recharts}
            </MenuItem>
          </SubMenu>
          <SubMenu
            label={dictionary['navigation'].others}
            icon={<i className='tabler-dots' />}
          >
            <MenuItem
              icon={<i className='tabler-cards' />}
              href={`${process.env.NEXT_PUBLIC_DOCS_URL}/docs/user-interface/foundation`}
              suffix={<i className='tabler-external-link text-xl' />}
              target='_blank'
            >
              {dictionary['navigation'].foundation}
            </MenuItem>
            <MenuItem
              icon={<i className='tabler-atom' />}
              href={`${process.env.NEXT_PUBLIC_DOCS_URL}/docs/user-interface/components`}
              suffix={<i className='tabler-external-link text-xl' />}
              target='_blank'
            >
              {dictionary['navigation'].components}
            </MenuItem>
            <MenuItem
              icon={<i className='tabler-list-search' />}
              href={`${process.env.NEXT_PUBLIC_DOCS_URL}/docs/menu-examples/overview`}
              suffix={<i className='tabler-external-link text-xl' />}
              target='_blank'
            >
              {dictionary['navigation'].menuExamples}
            </MenuItem>
            <MenuItem
              suffix={<i className='tabler-external-link text-xl' />}
              target='_blank'
              href='https://pixinvent.ticksy.com'
              icon={<i className='tabler-lifebuoy' />}
            >
              {dictionary['navigation'].raiseSupport}
            </MenuItem>
            <MenuItem
              suffix={<i className='tabler-external-link text-xl' />}
              target='_blank'
              icon={<i className='tabler-book-2' />}
              href='https://demos.pixinvent.com/vuexy-nextjs-admin-template/documentation'
            >
              {dictionary['navigation'].documentation}
            </MenuItem>
            <MenuItem
              suffix={
                <CustomChip
                  label='New'
                  size='small'
                  color='info'
                  round='true'
                />
              }
              icon={<i className='tabler-notification' />}
            >
              {dictionary['navigation'].itemWithBadge}
            </MenuItem>
            <MenuItem
              icon={<i className='tabler-link' />}
              href='https://pixinvent.com'
              target='_blank'
              suffix={<i className='tabler-external-link text-xl' />}
            >
              {dictionary['navigation'].externalLink}
            </MenuItem>
            <SubMenu
              label={dictionary['navigation'].menuLevels}
              icon={<i className='tabler-menu-2' />}
            >
              <MenuItem>{dictionary['navigation'].menuLevel2}</MenuItem>
              <SubMenu label={dictionary['navigation'].menuLevel2}>
                <MenuItem>{dictionary['navigation'].menuLevel3}</MenuItem>
                <MenuItem>{dictionary['navigation'].menuLevel3}</MenuItem>
              </SubMenu>
            </SubMenu>
            <MenuItem disabled>
              {dictionary['navigation'].disabledMenu}
            </MenuItem>
          </SubMenu>
       */}{' '}
        </Menu>

        {/* <Menu
        rootStyles={menuRootStyles(theme)}
        renderExpandIcon={({ level }) => <RenderExpandIcon level={level} />}
        menuItemStyles={menuItemStyles(settings, theme)}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        popoutMenuOffset={{
          mainAxis: ({ level }) => (level && level > 0 ? 14 : 12),
          alignmentAxis: 0
        }}
        verticalMenuProps={{
          menuItemStyles: verticalMenuItemStyles(verticalNavOptions, theme, settings),
          renderExpandIcon: ({ open }) => (
            <RenderVerticalExpandIcon open={open} transitionDuration={transitionDuration} />
          ),
          renderExpandedMenuItemIcon: { icon: <i className='tabler-circle text-xs' /> },
          menuSectionStyles: verticalMenuSectionStyles(verticalNavOptions, theme)
        }}
      >
        <GenerateHorizontalMenu menuData={menuData(dictionary, params)} />
      </Menu> */}
      </HorizontalNav>
    )
  }

export default HorizontalMenu
