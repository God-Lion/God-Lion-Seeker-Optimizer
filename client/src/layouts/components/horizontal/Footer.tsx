import { useTheme } from '@mui/material/styles'
import type { ChildrenType } from 'src/lib/types'
import themeConfig from 'src/configs/themeConfig'
import { useSettings } from 'src/core/contexts/settingsContext'
import { horizontalLayoutClasses } from 'src/layouts/utils/layoutClasses'
import StyledFooter from 'src/layouts/styles/horizontal/StyledFooter'
import classnames from 'classnames'

import type { CSSObject } from '@emotion/styled'
type Props = ChildrenType & {
  overrideStyles?: CSSObject
}

const Footer = (props: Props) => {
  const theme = useTheme()
  const { children, overrideStyles } = props
  const { settings } = useSettings()
  const { footerContentWidth } = settings
  const footerStatic = themeConfig.footer.type === 'static'
  const footerFixed = themeConfig.footer.type === 'fixed'
  const footerContentCompact = footerContentWidth === 'compact'
  const footerContentWide = footerContentWidth === 'wide'

  return (
    <StyledFooter
      theme={theme}
      overrideStyles={overrideStyles}
      className={classnames(horizontalLayoutClasses.footer, {
        [horizontalLayoutClasses.footerStatic]: footerStatic,
        [horizontalLayoutClasses.footerFixed]: footerFixed,
        [horizontalLayoutClasses.footerContentCompact]: footerContentCompact,
        [horizontalLayoutClasses.footerContentWide]: footerContentWide,
      })}
    >
      <div className={horizontalLayoutClasses.footerContentWrapper}>
        {children}
      </div>
    </StyledFooter>
  )
}

export default Footer
