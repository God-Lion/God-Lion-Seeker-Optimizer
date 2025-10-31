import React from 'react'
import { useTheme } from '@mui/material/styles'
import type { CSSObject } from '@emotion/styled'
import type { ChildrenType } from 'src/types'
import themeConfig from 'src/configs/themeConfig'
import { useSettings } from 'src/core/contexts/settingsContext'
import { horizontalLayoutClasses } from 'src/layouts/utils/layoutClasses'
import StyledHeader from 'src/layouts/styles/horizontal/StyledHeader'
import classnames from 'classnames'

type Props = ChildrenType & {
  overrideStyles?: CSSObject
}

const Header: React.FC<Props> = ({ children, overrideStyles }) => {
  const theme = useTheme()
  const { settings } = useSettings()
  const { navbarContentWidth } = settings

  const headerFixed = themeConfig.navbar.type === 'fixed'
  const headerStatic = themeConfig.navbar.type === 'static'
  const headerBlur = themeConfig.navbar.blur === true
  const headerContentCompact = navbarContentWidth === 'compact'
  const headerContentWide = navbarContentWidth === 'wide'

  return (
    <StyledHeader
      theme={theme}
      overrideStyles={overrideStyles}
      className={classnames(horizontalLayoutClasses.header, {
        [horizontalLayoutClasses.headerFixed]: headerFixed,
        [horizontalLayoutClasses.headerStatic]: headerStatic,
        [horizontalLayoutClasses.headerBlur]: headerBlur,
        [horizontalLayoutClasses.headerContentCompact]: headerContentCompact,
        [horizontalLayoutClasses.headerContentWide]: headerContentWide,
      })}
    >
      {children}
    </StyledHeader>
  )
}

export default Header
