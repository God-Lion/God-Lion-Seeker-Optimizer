// Shared configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  TIMEOUT: 30000,
  SSE_RECONNECT_INTERVAL: 5000,
  SSE_MAX_RETRIES: 5,
  // Deprecated alias for backward compatibility
  get baseURL() {
    return this.BASE_URL;
  },
} as const

export default API_CONFIG
