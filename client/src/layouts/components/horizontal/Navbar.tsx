import React from 'react'
import type { ChildrenType } from 'src/lib/types'
import Box from '@mui/material/Box'
import { horizontalLayoutClasses } from 'src/layouts/utils/layoutClasses'
import classnames from 'classnames'

const Navbar: React.FC<ChildrenType> = ({ children }) => {
  return (
    <Box
      className={classnames(horizontalLayoutClasses.navbar)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        inlineSize: '100%',
      }}
    >
      {children}
    </Box>
  )
}

export default Navbar
