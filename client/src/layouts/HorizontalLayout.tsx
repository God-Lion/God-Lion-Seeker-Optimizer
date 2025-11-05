import React from 'react'
import classnames from 'classnames'
import type { ChildrenType } from 'src/types'
import { HorizontalNavProvider } from 'src/menu/contexts/horizontalNavContext'
import LayoutContent from './components/horizontal/LayoutContent'
import { horizontalLayoutClasses } from './utils/layoutClasses'

const HorizontalLayout: React.FC<
  ChildrenType & {
    header?: React.ReactNode
    footer?: React.ReactNode
  }
> = ({ header, footer, children }) => {
  return (
    <div className={classnames(horizontalLayoutClasses.root, 'flex flex-auto')}>
      <HorizontalNavProvider>
        <div
          className={classnames(
            horizontalLayoutClasses.contentWrapper,
            'flex flex-col is-full',
          )}
        >
          {header || null}
          <LayoutContent>{children}</LayoutContent>
          {footer || null}
        </div>
      </HorizontalNavProvider>
    </div>
  )
}

export default HorizontalLayout
