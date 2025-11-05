import React from 'react'
import { Box } from '@mui/material'
import LayoutContent from 'src/layouts/components/horizontal/LayoutContent'
import { Navbar, Footer } from 'src/components'
import type { ChildrenType } from 'src/types'

const PublicLayout: React.FC<
  ChildrenType & {
    header?: React.ReactNode
    footer?: React.ReactNode
  }
> = ({ header, footer, children }) => {

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        margin: 0,
        padding: 0,
      }}
    >
      {/* Header Section - Dark background */}
      <Box
        sx={{
          backgroundColor: '#e6dbdbff',
          color: 'white',
          width: '100%',
          zIndex: 1000,
        }}
      >
        {header || <Navbar />}
      </Box>

      {/* Main Content Area - Coral/Red background */}
      <Box>
        <LayoutContent>{children}</LayoutContent>
      </Box>

      {/* Footer Section - Dark background */}
      <Box
        sx={{
          backgroundColor: '#1a1a1a',
          color: 'white',
          width: '100%',
        }}
      >
        {footer || <Footer />}
      </Box>
    </Box>
  )
}

export default PublicLayout
