// src/Modules/Scraper/services/scraper.service.ts

import { apiClient } from '../../../shared/api/api-client'
import { ENDPOINTS } from '../../../shared/api/config'
import { AxiosResponse } from 'axios'
import {
  ScrapeRequest,
  ScrapeResponse,
  ScrapingSession,
  SessionsListResponse,
  StopSessionResponse,
  SessionsQueryParams,
} from '../types/api.types'

/**
 * Scraper Service
 * All API calls related to job scraping operations using the global apiClient
 */
class ScraperService {
  /**
   * Start a new scraping job
   */
  async startScraping(data: ScrapeRequest): Promise<AxiosResponse<ScrapeResponse>> {
    return apiClient.post<ScrapeResponse>(ENDPOINTS.scraper.start, data)
  }

  /**
   * Get the status of a specific scraping session
   */
  async getSessionStatus(sessionId: number): Promise<AxiosResponse<ScrapingSession>> {
    return apiClient.get<ScrapingSession>(ENDPOINTS.scraper.session(sessionId))
  }

  /**
   * List all scraping sessions with optional filters and pagination
   */
  async listSessions(params: SessionsQueryParams = {}): Promise<AxiosResponse<SessionsListResponse>> {
    const searchParams = new URLSearchParams()

    if (params.skip !== undefined) searchParams.append('skip', String(params.skip))
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit))
    if (params.status) searchParams.append('status', params.status)

    const queryString = searchParams.toString()
    const url = queryString ? `${ENDPOINTS.scraper.sessions}?${queryString}` : ENDPOINTS.scraper.sessions

    return apiClient.get<SessionsListResponse>(url)
  }

  /**
   * Stop a running scraping session
   */
  async stopSession(sessionId: number): Promise<AxiosResponse<StopSessionResponse>> {
    return apiClient.post<StopSessionResponse>(ENDPOINTS.scraper.stop(sessionId))
  }

  /**
   * Get active sessions (running or pending)
   */
  async getActiveSessions(): Promise<AxiosResponse<SessionsListResponse>> {
    return this.listSessions({ limit: 100 })
  }

  /**
   * Get session history
   */
  async getSessionHistory(limit: number = 50): Promise<AxiosResponse<SessionsListResponse>> {
    return this.listSessions({ skip: 0, limit })
  }
}

// Export singleton instance
export const scraperService = new ScraperService()
