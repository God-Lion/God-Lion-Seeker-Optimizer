import React from 'react'
import GridLegacy from '@mui/material/GridLegacy'
import type { GridProps as GridLegacyProps } from '@mui/material/GridLegacy'

// Suppress the deprecation warning for GridLegacy
const originalWarn = console.warn
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('GridLegacy')) {
    return // Suppress GridLegacy deprecation warnings
  }
  originalWarn(...args)
}

const Grid: React.FC<GridLegacyProps> = (props) => {
  return <GridLegacy {...props} />
}

export default Grid
