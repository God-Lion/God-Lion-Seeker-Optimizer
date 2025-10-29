import React from 'react'
import { useKBar } from 'kbar'
import { Link } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import { CloudOff } from '@mui/icons-material'
import Icon from 'src/components/Icon'

const noResultData: Array<{
  label: string
  href: string
  icon: string
}> = [
  {
    label: 'Analytics',
    href: '/dashboards/analytics',
    icon: 'PieChart',
  },
  {
    label: 'User Profile',
    href: '/pages/user-profile',
    icon: 'Person',
  },
  {
    label: 'CRM',
    href: '/dashboards/crm',
    icon: 'tabler-3d-cube-sphere',
  },
]

const NoResult: React.FC<{
  query: string | undefined
}> = ({ query }) => {
  const { query: kbarQuery } = useKBar()

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        flexWrap: 'wrap',
        paddingBlock: '3.5rem',
        paddingInline: '4rem',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <Box
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <CloudOff
          sx={{
            fontSize: '48px',
            marginBlockEnd: '0.625rem',
          }}
        />
        <Typography
          sx={{
            fontSize: '1.125rem',
            // lineHeight: '1.75rem',
            fontWeight: 500,
            lineHeight: 1.55556,
            marginBlockEnd: '2.75rem',
          }}
        >{`No result for "${query}"`}</Typography>
        <Typography
          sx={{
            fontSize: '15px',
            lineHeight: 1.4667,
            marginBlockEnd: '1rem',
            color: 'var(--mui-palette-text-disabled)',
          }}
        >
          Try searching for
        </Typography>
        <Box
          component='ul'
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {noResultData.map((item, index) => (
            <Box
              component='li'
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box
                component={Link}
                to={item.href}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  '&:hover': {
                    color: 'var(--primary-color)',
                  },
                  '&:focus-visible': {
                    color: 'var(--primary-color)',
                    outlineWidth: '0px',
                  },
                }}
                onClick={kbarQuery.toggle}
              >
                <Icon
                  icon={item.icon}
                  sx={{
                    fontSize: '1.25rem',
                    lineHeight: '1.75rem',
                  }}
                />
                <Typography
                  sx={{
                    fontSize: '15px',
                    lineHeight: 1.4667,
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
    </Box>
  )
}

export default NoResult
