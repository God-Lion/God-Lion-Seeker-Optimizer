import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';

export const useAdminSystemHealth = () => {
  return useQuery({
    queryKey: ['admin', 'system-health'],
    queryFn: () => adminService.getSystemHealth(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000,
  });
};
