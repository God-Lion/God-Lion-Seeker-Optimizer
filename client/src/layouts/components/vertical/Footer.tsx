import React from 'react'
import { useTheme } from '@mui/material/styles'
import type { ChildrenType } from 'src/types'
import themeConfig from 'src/configs/themeConfig'
import { useSettings } from 'src/core/contexts/settingsContext'
import { verticalLayoutClasses } from 'src/layouts/utils/layoutClasses'
import StyledFooter from 'src/layouts/styles/vertical/StyledFooter'
import classnames from 'classnames'
import type { CSSObject } from '@emotion/styled'
import Box from '@mui/material/Box'

const Footer: React.FC<
  ChildrenType & {
    overrideStyles?: CSSObject
  }
> = ({ children, overrideStyles }) => {
  const theme = useTheme()
  const { settings } = useSettings()
  const { footerContentWidth } = settings

  const footerDetached = themeConfig.footer.detached === true
  const footerAttached = themeConfig.footer.detached === false
  const footerStatic = themeConfig.footer.type === 'static'
  const footerFixed = themeConfig.footer.type === 'fixed'
  const footerContentCompact = footerContentWidth === 'compact'
  const footerContentWide = footerContentWidth === 'full'

  return (
    <StyledFooter
      theme={theme}
      overrideStyles={overrideStyles}
      className={classnames(
        verticalLayoutClasses.footer,
        // 'is-full',
        {
          [verticalLayoutClasses.footerDetached]: footerDetached,
          [verticalLayoutClasses.footerAttached]: footerAttached,
          [verticalLayoutClasses.footerStatic]: footerStatic,
          [verticalLayoutClasses.footerFixed]: footerFixed,
          [verticalLayoutClasses.footerContentCompact]: footerContentCompact,
          [verticalLayoutClasses.footerContentWide]: footerContentWide,
        },
      )}
      style={{
        inlineSize: '100%',
      }}
    >
      <Box className={verticalLayoutClasses.footerContentWrapper}>
        {children}
      </Box>
    </StyledFooter>
  )
}

export default Footer
