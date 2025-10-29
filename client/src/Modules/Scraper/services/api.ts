/**
 * Scraper API Service
 * Handles all API calls related to job scraping operations
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface ScrapeRequest {
  query: string;
  location?: string;
  max_jobs?: number;
  experience_level?: string;
}

export interface ScrapeResponse {
  session_id: number;
  status: string;
  message: string;
  query: string;
  location: string;
  max_jobs: number;
  timestamp: string;
}

export interface ScrapingSession {
  session_id: number;
  query: string;
  location: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
  jobs_found: number;
  jobs_scraped: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface SessionsListResponse {
  sessions: ScrapingSession[];
  skip: number;
  limit: number;
  total: number;
}

class ScraperApiService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Start a new scraping job
   */
  async startScraping(request: ScrapeRequest): Promise<ScrapeResponse> {
    return this.makeRequest<ScrapeResponse>('/scraping/start', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get the status of a scraping session
   */
  async getSessionStatus(sessionId: number): Promise<ScrapingSession> {
    return this.makeRequest<ScrapingSession>(`/scraping/sessions/${sessionId}`);
  }

  /**
   * List all scraping sessions
   */
  async listSessions(skip: number = 0, limit: number = 20): Promise<SessionsListResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('skip', skip.toString());
    searchParams.append('limit', limit.toString());

    return this.makeRequest<SessionsListResponse>(`/scraping/sessions?${searchParams.toString()}`);
  }

  /**
   * Stop a running scraping session
   */
  async stopSession(sessionId: number): Promise<{ session_id: number; status: string; message: string; stopped_at: string }> {
    return this.makeRequest<{ session_id: number; status: string; message: string; stopped_at: string }>(
      `/scraping/sessions/${sessionId}/stop`,
      { method: 'POST' }
    );
  }
}

export const scraperApiService = new ScraperApiService();
