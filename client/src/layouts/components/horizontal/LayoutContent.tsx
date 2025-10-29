import React from 'react'
import type { ChildrenType } from 'src/lib/types'
import themeConfig from 'src/configs/themeConfig'
import { useSettings } from 'src/core/contexts/settingsContext'
import { horizontalLayoutClasses } from 'src/layouts/utils/layoutClasses'
import StyledMain from 'src/layouts/styles/shared/StyledMain'
import classnames from 'classnames'

const LayoutContent: React.FC<ChildrenType> = ({ children }) => {
  const { settings } = useSettings()
  const contentCompact = settings.contentWidth === 'compact'
  const contentWide = settings.contentWidth === 'wide'

  return (
    <StyledMain
      isContentCompact={contentCompact}
      className={classnames(horizontalLayoutClasses.content, 'flex-auto', {
        [`${horizontalLayoutClasses.contentCompact} is-full`]: contentCompact,
        [horizontalLayoutClasses.contentWide]: contentWide,
      })}
      style={{ padding: themeConfig.layoutPadding }}
    >
      {children}
    </StyledMain>
  )
}

export default LayoutContent
