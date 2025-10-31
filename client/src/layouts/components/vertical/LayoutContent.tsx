import type { ChildrenType } from 'src/types'
import { useSettings } from 'src/core/contexts/settingsContext'
import { verticalLayoutClasses } from 'src/layouts/utils/layoutClasses'
import StyledMain from 'src/layouts/styles/shared/StyledMain'
import classnames from 'classnames'

const LayoutContent = ({ children }: ChildrenType) => {
  const { settings } = useSettings()

  const contentCompact = settings.contentWidth === 'compact'
  const contentWide = settings.contentWidth === 'wide'

  return (
    <StyledMain
      isContentCompact={contentCompact}
      className={classnames(
        verticalLayoutClasses.content,
        // 'flex-auto',
        {
          [`${verticalLayoutClasses.contentCompact} is-full`]: contentCompact,
          [verticalLayoutClasses.contentWide]: contentWide,
        },
      )}
      style={{
        flex: '1 1 auto',
        inlineSize: '100%',
      }}
    >
      {children}
    </StyledMain>
  )
}

export default LayoutContent
