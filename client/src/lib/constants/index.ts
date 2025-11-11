/**
 * Constants Library - Centralized constants
 * 
 * Consolidated from various locations
 */

// JSON data can be imported directly
export { default as departementState } from '../../utils/departement_state.json'

// Legacy JS modules (import directly when needed)
// - countryState: import countryState from 'src/utils/country_state'
// - zone2: import zone2 from 'src/utils/zone2'
// - size: import size from 'src/utils/size'

// Application constants
export const API_TIMEOUT = 30000
export const MAX_RETRIES = 3
export const CACHE_TTL = 5000
export const MAX_PENDING_REQUESTS = 100
