// src/Modules/Scraper/hooks/index.ts

/**
 * Centralized exports for all Scraper hooks
 */

// React Query hooks for API calls
export {
  useScrapingSessions,
  useScrapingSession,
  useActiveSessions,
  useSessionHistory,
  useStartScraping,
  useStopSession,
  useRefreshSession,
} from './useScraperQuery'
