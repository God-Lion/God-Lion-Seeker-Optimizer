import React from 'react'
import { useTheme } from '@mui/material/styles'
import type { CSSObject } from '@emotion/styled'
import type { ChildrenType } from 'src/types'
import themeConfig from 'src/configs/themeConfig'
import { useSettings } from 'src/core/contexts/settingsContext'
import { verticalLayoutClasses } from 'src/layouts/utils/layoutClasses'
import StyledHeader from 'src/layouts/styles/vertical/StyledHeader'
import classnames from 'classnames'
import { Box } from '@mui/material'

const Navbar: React.FC<
  ChildrenType & {
    overrideStyles?: CSSObject
  }
> = (props) => {
  const theme = useTheme()
  const { children, overrideStyles } = props
  const { settings } = useSettings()
  const { navbarContentWidth } = settings

  const headerFixed = themeConfig.navbar.type === 'fixed'
  const headerStatic = themeConfig.navbar.type === 'static'
  const headerFloating = themeConfig.navbar.floating === true
  const headerDetached = themeConfig.navbar.detached === true
  const headerAttached = themeConfig.navbar.detached === false
  const headerBlur = themeConfig.navbar.blur === true
  const headerContentCompact = navbarContentWidth === 'compact'
  const headerContentWide = navbarContentWidth === 'wide'

  return (
    <StyledHeader
      theme={theme}
      overrideStyles={overrideStyles}
      className={classnames(
        verticalLayoutClasses.header,
        // 'flex items-center justify-center is-full',
        {
          [verticalLayoutClasses.headerFixed]: headerFixed,
          [verticalLayoutClasses.headerStatic]: headerStatic,
          [verticalLayoutClasses.headerFloating]: headerFloating,
          [verticalLayoutClasses.headerDetached]:
            !headerFloating && headerDetached,
          [verticalLayoutClasses.headerAttached]:
            !headerFloating && headerAttached,
          [verticalLayoutClasses.headerBlur]: headerBlur,
          [verticalLayoutClasses.headerContentCompact]: headerContentCompact,
          [verticalLayoutClasses.headerContentWide]: headerContentWide,
        },
      )}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        inlineSize: '100%',
      }}
    >
      <Box
        className={classnames(
          verticalLayoutClasses.navbar,
          // 'flex bs-full'
        )}
        sx={{
          display: 'flex',
          blockSize: '100%',
        }}
      >
        {children}
      </Box>
    </StyledHeader>
  )
}

export default Navbar
