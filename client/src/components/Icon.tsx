import React from 'react'
// import { Dashboard, TrendingUp } from '@mui/icons-material'
import * as icons from '@mui/icons-material'
import { SxProps } from '@mui/material'

// const iconMap = {
//   Dashboard: Dashboard,
//   TrendingUp: TrendingUp,
// }

const Icon: React.FC<{
  icon: string
  sx?: SxProps
}> = ({ icon, sx }) => {
  const IconComponent = icons[icon as keyof typeof icons]
  return IconComponent ? <IconComponent sx={sx} /> : null
}

export default Icon
