/**
 * Utils Library - Consolidated utility functions
 * 
 * Merged from:
 * - src/utils/
 * - src/core/utils/ (if any)
 */

// Session & Auth utilities
export * from '../../utils/getRole'

// Data utilities
export * from '../../utils/Filters'
export * from '../../utils/helper'

// State management

// Type utilities
export * from '../../utils/IAxiosError'

// Color utilities
export * from '../../utils/rgbaToHex'

// Internationalization
export * from '../../utils/getDictionary'


// Legacy JS modules (import directly when needed)
// - Encrypt: import Encrypt from 'src/utils/Encrypt'
// - Functions: import Functions from 'src/utils/Functions'
// - color: import color from 'src/utils/color'
// - initVirtualTable: import initVirtualTable from 'src/utils/initVirtualTable'
// - AlertReact: import AlertReact from 'src/utils/AlertReact'
