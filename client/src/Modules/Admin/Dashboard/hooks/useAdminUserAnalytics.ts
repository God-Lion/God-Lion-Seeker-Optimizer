import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';

export const useAdminUserAnalytics = () => {
  return useQuery({
    queryKey: ['admin', 'user-analytics'],
    queryFn: () => adminService.getUserAnalytics(),
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
  });
};
