import React from 'react'
import { Link } from 'react-router-dom'
import { useKBar } from 'kbar'
import { Box, Typography } from '@mui/material'
import Icon from 'src/components/Icon'

const defaultSuggestions: Array<{
  sectionLabel: string
  items: Array<{
    label: string
    href: string
    icon?: string
  }>
}> = [
  {
    sectionLabel: 'Popular Searches',
    items: [
      {
        label: 'Analytics',
        href: '/dashboards/analytics',
        icon: 'TrendingUp',
      },
      // {
      //   label: 'CRM',
      //   href: '/dashboards/crm',
      //   icon: 'tabler-chart-pie-2',
      // },
      // {
      //   label: 'eCommerce',
      //   href: '/dashboards/ecommerce',
      //   icon: 'tabler-shopping-cart',
      // },
      // {
      //   label: 'User List',
      //   href: '/apps/user/list',
      //   icon: 'tabler-file-description',
      // },
    ],
  },
  {
    sectionLabel: 'Apps',
    items: [
      {
        label: 'Calendar',
        href: '/apps/calendar',
        // icon: 'tabler-calendar',
        icon: 'Event',
      },
      // {
      //   label: 'Invoice List',
      //   href: '/apps/invoice/list',
      //   icon: 'tabler-file-info',
      // },
      // {
      //   label: 'User List',
      //   href: '/apps/user/list',
      //   icon: 'tabler-file-invoice',
      // },
      // {
      //   label: 'Roles & Permissions',
      //   href: '/apps/roles',
      //   icon: 'tabler-lock',
      // },
    ],
  },
  {
    sectionLabel: 'Pages',
    items: [
      {
        label: 'User Profile',
        href: '/pages/user-profile',
        icon: 'Person',
        // icon: (
        //   <Person
        //     sx={{ display: 'flex', fontSize: '1.25rem', lineHeight: '1.75rem' }}
        //   />
        // ), //icon: 'tabler-user',
      },
      // {
      //   label: 'Account Settings',
      //   href: '/pages/account-settings',
      //   icon: 'tabler-settings',
      // },
      // {
      //   label: 'Pricing',
      //   href: '/pages/pricing',
      //   icon: 'tabler-currency-dollar',
      // },
      // {
      //   label: 'FAQ',
      //   href: '/pages/faq',
      //   icon: 'tabler-help-circle',
      // },
    ],
  },
  {
    sectionLabel: 'Forms & Charts',
    items: [
      {
        label: 'Form Layouts',
        href: '/forms/form-layouts',
        icon: 'Layout',
      },
      //     {
      //       label: 'Form Validation',
      //       href: '/forms/form-validation',
      //       icon: 'tabler-checkup-list',
      //     },
      //     {
      //       label: 'Form Wizard',
      //       href: '/forms/form-wizard',
      //       icon: 'tabler-git-merge',
      //     },
      //     {
      //       label: 'Apex Charts',
      //       href: '/charts/apex-charts',
      //       icon: 'tabler-chart-ppf',
      //     },
    ],
  },
]

const DefaultSuggestions = () => {
  const { query } = useKBar()

  return (
    <Box
      sx={{
        display: 'flex',
        flexGrow: 1,
        flexWrap: 'wrap',
        columnGap: '48px',
        rowGap: '2rem',
        paddingBlock: '3.5rem',
        paddingInline: '4rem',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {defaultSuggestions.map((section, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            overflowX: 'hidden',
            gap: '1rem',
            flexBasis: {
              sm: 'calc((100% - 3rem) / 2)',
              // xl: '100%',
            },
          }}
        >
          <Typography
            sx={{
              fontSize: '0.75rem',
              // lineHeight: '1rem',
              lineHeight: '1.16667',
              textTransform: 'uppercase',
              color: 'var(--mui-palette-text-disabled)',
              letterSpacing: '0.8px',
            }}
          >
            {section.sectionLabel}
          </Typography>
          <Box
            component='ul'
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {section.items.map((item, i) => (
              <Box
                component='li'
                key={i}
                sx={{
                  display: 'flex',
                }}
              >
                <Box
                  to={item.href}
                  onClick={query.toggle}
                  component={Link}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    overflowX: 'hidden',
                    cursor: 'pointer',
                    gap: '0.5rem',
                    '&:hover': {
                      color: 'var(--primary-color)',
                    },
                    '&:focus-visible': {
                      color: 'var(--primary-color)',
                      outlineWidth: '0px',
                    },
                  }}
                >
                  {item.icon && (
                    <Icon
                      icon={item.icon}
                      sx={{
                        display: 'flex',
                        fontSize: '1.25rem',
                        lineHeight: '1.75rem',
                      }}
                    />
                  )}
                  <Typography
                    sx={{
                      fontSize: '15px',
                      lineHeight: '1.4667',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default DefaultSuggestions
