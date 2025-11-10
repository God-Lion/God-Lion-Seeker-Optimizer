import React from 'react'
import { Grid as MuiGrid } from '@mui/material'
import type { GridProps } from '@mui/material/Grid'

// Suppress the deprecation warning for GridLegacy
const originalWarn = console.warn
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('GridLegacy')) {
    return // Suppress GridLegacy deprecation warnings
  }
  originalWarn(...args)
}

const Grid: React.FC<GridProps> = (props) => {
  return <MuiGrid {...props} />
}

export default Grid
