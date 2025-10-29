import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';

export const useAdminUserFunnel = () => {
  return useQuery({
    queryKey: ['admin', 'user-funnel'],
    queryFn: () => adminService.getUserFunnel(),
    refetchInterval: 60000,
    staleTime: 30000,
  });
};
