/* eslint-disable prettier/prettier */
const port = 8000
const baseUri = `http://localhost:${port}/`

// Check if backend is available
export async function isBackendAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${baseUri}health`, { 
      method: 'GET',
      mode: 'cors',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    return response.ok
  } catch (error) {
    console.warn('Backend not available:', error)
    return false
  }
}

export function baseUrl() {
  // const origin = window.location.origin
  // let local = `${origin}/api/`
  // const port = 3000
  let usingLink = baseUri
  return usingLink
}

export function baseApi() {
  let local = `${baseUri}/api/`
  // v1/api/
  let usingLink = local
  return usingLink
}

// Fallback data for when API is not available
export const FALLBACK_DATA = {
  jobs: {
    data: [],
    total: 0,
    skip: 0,
    limit: 20
  },
  analytics: {
    totalJobs: 0,
    totalScraped: 0,
    activeListings: 0,
    applicationsReceived: 0
  },
  translations: {
    en: {},
    fr: {},
    ar: {}
  }
}

// Create axios instance
import axios from 'axios'

const apiClient = axios.create({
  baseURL: baseApi(),
  headers: {
    'Content-Type': 'application/json',
  },
})

export { apiClient }
export default apiClient