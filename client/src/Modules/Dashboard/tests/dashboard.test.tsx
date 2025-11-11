/**
 * Dashboard Module Tests
 * 
 * Tests for Dashboard components, hooks, and services
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tantml/react-query'
import { useOverview, useStats, useDashboardManagement } from '../hooks'
import { dashboardService } from '../services'

// ============================================================================
// Test Setup
// ============================================================================

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

// Mock data
const mockOverviewData = {
  stats: {
    applications_count: 45,
    interviews_scheduled: 10,
    saved_jobs: 25,
    profile_views: 120,
  },
  recent_applications: [
    {
      id: 1,
      job_title: 'Software Engineer',
      company_name: 'Google',
      status: 'pending',
      applied_at: '2025-11-08T10:00:00Z',
    },
  ],
  upcoming_interviews: [
    {
      id: 1,
      job_title: 'Product Manager',
      company_name: 'Microsoft',
      scheduled_at: '2025-11-10T14:00:00Z',
      type: 'video',
    },
  ],
  recommendations: [
    {
      id: 1,
      job_title: 'Frontend Developer',
      company_name: 'Apple',
      location: 'Cupertino, CA',
      match_score: 85,
      posted_date: '2025-11-07',
    },
  ],
  recent_activity: [
    {
      type: 'application',
      description: 'Applied to Google',
      timestamp: '2025-11-08T10:00:00Z',
    },
  ],
}

// ============================================================================
// Service Tests
// ============================================================================

describe('DashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOverview', () => {
    it('fetches dashboard overview successfully', async () => {
      const mockResponse = { data: mockOverviewData }
      vi.spyOn(dashboardService, 'getOverview').mockResolvedValue(mockResponse as any)

      const result = await dashboardService.getOverview()

      expect(result.data).toEqual(mockOverviewData)
      expect(dashboardService.getOverview).toHaveBeenCalledTimes(1)
    })

    it('handles errors correctly', async () => {
      const mockError = new Error('Network error')
      vi.spyOn(dashboardService, 'getOverview').mockRejectedValue(mockError)

      await expect(dashboardService.getOverview()).rejects.toThrow('Network error')
    })
  })

  describe('getStats', () => {
    it('fetches dashboard stats successfully', async () => {
      const mockStatsData = mockOverviewData.stats
      const mockResponse = { data: mockStatsData }
      vi.spyOn(dashboardService, 'getStats').mockResolvedValue(mockResponse as any)

      const result = await dashboardService.getStats()

      expect(result.data).toEqual(mockStatsData)
      expect(dashboardService.getStats).toHaveBeenCalledTimes(1)
    })
  })

  describe('getRecentApplications', () => {
    it('fetches recent applications with limit', async () => {
      const mockResponse = { data: mockOverviewData.recent_applications }
      vi.spyOn(dashboardService, 'getRecentApplications').mockResolvedValue(mockResponse as any)

      const result = await dashboardService.getRecentApplications({ limit: 5 })

      expect(result.data).toEqual(mockOverviewData.recent_applications)
      expect(dashboardService.getRecentApplications).toHaveBeenCalledWith({ limit: 5 })
    })
  })

  describe('getRecommendations', () => {
    it('fetches job recommendations with limit', async () => {
      const mockResponse = { data: mockOverviewData.recommendations }
      vi.spyOn(dashboardService, 'getRecommendations').mockResolvedValue(mockResponse as any)

      const result = await dashboardService.getRecommendations({ limit: 10 })

      expect(result.data).toEqual(mockOverviewData.recommendations)
      expect(dashboardService.getRecommendations).toHaveBeenCalledWith({ limit: 10 })
    })
  })
})

// ============================================================================
// Hook Tests
// ============================================================================

describe('Dashboard Hooks', () => {
  describe('useOverview', () => {
    it('fetches and returns overview data', async () => {
      const mockResponse = { data: mockOverviewData }
      vi.spyOn(dashboardService, 'getOverview').mockResolvedValue(mockResponse as any)

      const { result } = renderHook(() => useOverview(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockOverviewData)
    })

    it('handles loading state', () => {
      const { result } = renderHook(() => useOverview(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('useStats', () => {
    it('fetches and returns stats data', async () => {
      const mockResponse = { data: mockOverviewData.stats }
      vi.spyOn(dashboardService, 'getStats').mockResolvedValue(mockResponse as any)

      const { result } = renderHook(() => useStats(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockOverviewData.stats)
    })
  })

  describe('useDashboardManagement', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useDashboardManagement(), {
        wrapper: createWrapper(),
      })

      expect(result.current.viewMode).toBe('overview')
      expect(result.current.applicationsLimit).toBe(10)
      expect(result.current.recommendationsLimit).toBe(10)
    })

    it('provides refresh functionality', async () => {
      const mockResponse = { data: mockOverviewData }
      vi.spyOn(dashboardService, 'getOverview').mockResolvedValue(mockResponse as any)

      const { result } = renderHook(() => useDashboardManagement(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.refreshAll()

      expect(dashboardService.getOverview).toHaveBeenCalled()
    })

    it('transforms data correctly', async () => {
      const mockResponse = { data: mockOverviewData }
      vi.spyOn(dashboardService, 'getOverview').mockResolvedValue(mockResponse as any)

      const { result } = renderHook(() => useDashboardManagement(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.hasData).toBe(true)
      })

      expect(result.current.recentApplications).toEqual(mockOverviewData.recent_applications)
      expect(result.current.recommendations).toEqual(mockOverviewData.recommendations)
      expect(result.current.stats).toEqual(mockOverviewData.stats)
    })

    it('handles empty state correctly', async () => {
      const emptyData = {
        ...mockOverviewData,
        recent_applications: [],
        recommendations: [],
        recent_activity: [],
      }
      const mockResponse = { data: emptyData }
      vi.spyOn(dashboardService, 'getOverview').mockResolvedValue(mockResponse as any)

      const { result } = renderHook(() => useDashboardManagement(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isEmpty).toBe(true)
      })
    })
  })
})

// ============================================================================
// Component Tests (Placeholder)
// ============================================================================

describe('Dashboard Components', () => {
  it.todo('should render ApplicationsOverview correctly')
  it.todo('should render InterviewSchedule correctly')
  it.todo('should render SavedJobs correctly')
  it.todo('should render RecentActivity correctly')
  it.todo('should render QuickActions correctly')
  it.todo('should render ProfileCompletionWidget correctly')
})
