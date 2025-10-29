import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';

export const useAdminRecommendationPerformance = () => {
  return useQuery({
    queryKey: ['admin', 'recommendation-performance'],
    queryFn: () => adminService.getRecommendationPerformance(),
    refetchInterval: 60000,
    staleTime: 30000,
  });
};
