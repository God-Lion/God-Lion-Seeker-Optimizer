import React from 'react'
import type { ChildrenType } from 'src/types'
import LayoutContent from './components/vertical/LayoutContent'
import { verticalLayoutClasses } from './utils/layoutClasses'
import classnames from 'classnames'
import { Box } from '@mui/material'

const VerticalLayout: React.FC<
  ChildrenType & {
    navigation?: React.ReactNode
    navbar?: React.ReactNode
    footer?: React.ReactNode
  }
> = ({ children, navbar, footer, navigation }) => {
  return (
    <Box
      className={classnames(verticalLayoutClasses.root)}
      sx={{ display: 'flex', flex: '1 1 auto' }}
    >
      {navigation || null}
      <Box
        className={classnames(verticalLayoutClasses.contentWrapper)}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minInlineSize: '0px',
          inlineSize: '100%',
        }}
      >
        {navbar || null}
        <LayoutContent>{children}</LayoutContent>
        {footer || null}
      </Box>
    </Box>
  )
}

export default VerticalLayout
