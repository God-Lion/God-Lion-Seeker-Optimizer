import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';

export const useAdminJobMarketTrends = () => {
  return useQuery({
    queryKey: ['admin', 'job-market-trends'],
    queryFn: () => adminService.getJobMarketTrends(),
    refetchInterval: 300000, // Refetch every 5 minutes
    staleTime: 120000,
  });
};
