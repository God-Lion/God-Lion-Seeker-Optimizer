import React from 'react'
// import type { ChipProps } from '@mui/material/Chip'

export type IMenu = {
  name: string
  icon?: string
  link?: string
  prefix?: React.ReactNode //| ChipProps
  suffix?: React.ReactNode //| ChipProps
  submenu?: Array<IMenu>
  menusection?: {
    name: string
    menu: IMenu | Array<IMenu>
  }
}
