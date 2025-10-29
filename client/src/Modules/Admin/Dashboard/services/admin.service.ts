import { apiClient } from 'src/lib/api';

export const adminService = {
  // System Health
  getSystemHealth: async () => {
    const response = await apiClient.get('/api/admin/system-health');
    return response.data;
  },

  // User Analytics
  getUserAnalytics: async () => {
    const response = await apiClient.get('/api/admin/user-analytics');
    return response.data;
  },

  // Job Market Trends
  getJobMarketTrends: async () => {
    const response = await apiClient.get('/api/admin/job-market-trends');
    return response.data;
  },

  // User Funnel
  getUserFunnel: async () => {
    const response = await apiClient.get('/api/admin/user-funnel');
    return response.data;
  },

  // Recommendation Performance
  getRecommendationPerformance: async () => {
    const response = await apiClient.get('/api/admin/recommendation-performance');
    return response.data;
  },

  // Dashboard Summary
  getDashboardSummary: async () => {
    const response = await apiClient.get('/api/admin/dashboard-summary');
    return response.data;
  },
};

export default adminService;
