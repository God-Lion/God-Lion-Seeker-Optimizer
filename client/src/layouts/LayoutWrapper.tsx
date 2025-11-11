import type { ReactElement } from 'react'
import type { SystemMode } from 'src/core/types'
import { useSettings } from 'src/core/contexts/settingsContext'
import Box from '@mui/material/Box'
import { useLocation } from 'react-router-dom'

const noLayoutArray = [
  `auth`,
  `auth/signin`,
  `auth/signup`,
  `auth/signin2`,
  `auth/verification/email`,
  `auth/forgetpassword`,
  `auth/reset-password`,
]

const LayoutWrapper = ({
  verticalLayout,
  horizontalLayout,
  noLayout,
  publicLayout,
}: {
  systemMode: SystemMode
  verticalLayout: ReactElement
  horizontalLayout: ReactElement
  noLayout?: ReactElement
  publicLayout?: ReactElement
}) => {
  const location = useLocation()
  const pathname = location.pathname
  const { settings } = useSettings()

  // Theme initialization is now handled by ModeChanger component

  const isNolayout = noLayoutArray
    .map((el) => `/${el}`.toLocaleLowerCase())
    .includes(pathname.toLocaleLowerCase())

  if (isNolayout) return noLayout

  const isAdminlayout = ['/admin', '/provider'].some((el) =>
    pathname.toLocaleLowerCase().startsWith(el),
  )

  if (isAdminlayout)
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 auto',
          // backgroundColor: 'transparent',
          backgroundColor: '#F05',
        }}
        data-skin={settings.skin}
      >
        {settings.layout === 'horizontal' ? horizontalLayout : verticalLayout}
      </Box>
    )
  return publicLayout
}

export default LayoutWrapper
