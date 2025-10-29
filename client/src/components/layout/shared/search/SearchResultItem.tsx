import React from 'react'
import { useTheme } from '@mui/material/styles'
import type { ActionId, ActionImpl } from 'kbar'
import { useLocation, useParams } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import {
  SubdirectoryArrowLeft,
  SubdirectoryArrowRight,
} from '@mui/icons-material'
import Icon from 'src/components/Icon'
import type { SearchData } from './types'
import type { Locale } from 'src/configs/i18n'

const Title: React.FC<{
  title: string
  flexGrow?: boolean
}> = ({ title, flexGrow = false }) => {
  return flexGrow ? (
    <Typography
      component='span'
      sx={{
        flexGrow: 1,
        fontSize: '15px',
        lineHeight: 1.4667,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {title}
    </Typography>
  ) : (
    <Typography
      component='span'
      sx={{
        fontSize: '15px',
        lineHeight: 1.4667,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {title}
    </Typography>
  )
}

const TitleWithAncestors: React.FC<{
  title: string
  flexGrow?: boolean
  ancestors: Array<ActionImpl>
}> = ({ title, flexGrow = false, ancestors }) => {
  if (ancestors.length === 0) return <Title title={title} flexGrow={flexGrow} />

  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: '0.5rem' }}
    >
      {ancestors.map((ancestor: ActionImpl) => (
        <React.Fragment key={ancestor.id}>
          <Typography component='span' style={{ opacity: 0.5 }}>
            {ancestor.name}
          </Typography>
          <Typography component='span'>&rsaquo;</Typography>
        </React.Fragment>
      ))}
      <Title title={title} flexGrow={flexGrow} />
    </Box>
  )
}

const Shortcut: React.FC<{ shortcut: Array<string> }> = ({ shortcut }) => {
  if (shortcut.length > 1) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
        }}
      >
        {shortcut.map((sc) => (
          <Box
            component='kbd'
            className='kbd'
            key={sc}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              inlineSize: '1.5rem',
              marginBlockStart: '1.5rem',
              borderRadius: 'var(--mui-shape-customBorderRadius-sm)',
              fontSize: '0.875rem',
              lineHeight: '1.25rem',
              backgroundColor: 'var(--mui-palette-action-selected)',
            }}
          >
            {sc}
          </Box>
        ))}
      </Box>
    )
  }

  return (
    <Box
      component='kbd'
      // className='kbd'
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        inlineSize: '1.5rem',
        marginBlockStart: '1.5rem',
        borderRadius: 'var(--mui-shape-customBorderRadius-sm)',
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
        backgroundColor: 'var(--mui-palette-action-selected)',
      }}
    >
      {shortcut[0]}
    </Box>
  )
}

const EnterComponent: React.FC<{
  active: boolean
  currentPath: string
  data: SearchData
  locale: Locale
}> = ({ active, currentPath, data, locale }) => {
  const theme = useTheme()
  const location = useLocation()
  const pathname = location.pathname
  if (active && theme.direction === 'ltr')
    return (
      <SubdirectoryArrowLeft
        sx={{
          ...(currentPath === pathname && {
            color: 'var(--primary-color)',
          }),
        }}
      />
    )

  if (active && theme.direction === 'rtl')
    return (
      <SubdirectoryArrowRight
        sx={{
          ...(currentPath === pathname && {
            color: 'var(--primary-color)',
          }),
        }}
      />
    )
}

const SearchResultItem = React.forwardRef(
  (
    {
      action,
      active,
      currentRootActionId,
      currentPath,
      data,
    }: {
      action: ActionImpl
      active: boolean
      currentRootActionId: ActionId | undefined | null
      currentPath: string
      data: SearchData
    },
    ref: React.Ref<HTMLDivElement>,
  ) => {
    const location = useLocation()
    const pathname = location.pathname
    const { lang: locale } = useParams()
    const ancestors = React.useMemo(() => {
      if (!currentRootActionId) return action.ancestors

      const index = action.ancestors.findIndex(
        (ancestor) => ancestor.id === currentRootActionId,
      )

      return action.ancestors.slice(index + 1)
    }, [action.ancestors, currentRootActionId])

    return (
      <Box
        ref={ref}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          paddingBlock: '0.5rem',
          paddingInline: '1rem',
          cursor: 'pointer',
          borderRadius: 'var(--mui-shape-customBorderRadius-md)',
          ...(active && {
            backgroundColor: 'var(--mui-palette-action-selected)',
          }),
          ...(!active &&
            currentPath === pathname && {
              backgroundColor: 'var(--mui-palette-primary-lightOpacity)',
              color: 'var(--primary-color)',
            }),
          ...(active &&
            currentPath === pathname && {
              backgroundColor: 'var(--mui-palette-primary-mainOpacity)',
              color: 'var(--primary-color)',
            }),
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexGrow: 1,
            gap: '0.5rem',
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
          }}
        >
          {action.icon && (
            <Icon
              icon={action.icon as string}
              sx={{
                fontSize: '1.25rem',
                lineHeight: '1.75rem',
              }}
            />
          )}
          {action.name &&
            (action.subtitle ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1,
                }}
              >
                <TitleWithAncestors title={action.name} ancestors={ancestors} />
                {action.subtitle && (
                  <Typography
                    component='span'
                    sx={{
                      fontSize: '13px',
                      lineHeight: 1.538462,
                      color: 'var(--mui-palette-text-secondary)',
                    }}
                  >
                    {action.subtitle}
                  </Typography>
                )}
              </Box>
            ) : (
              <TitleWithAncestors
                flexGrow
                title={action.name}
                ancestors={ancestors}
              />
            ))}
        </Box>
        <EnterComponent
          active={active}
          currentPath={currentPath}
          data={data}
          locale={locale as Locale}
        />
        {action.shortcut?.length && <Shortcut shortcut={action.shortcut} />}
      </Box>
    )
  },
)

export default SearchResultItem
