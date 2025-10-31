import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from 'src/utils/api_link';
import { UsersListData, UserStatus } from '../../types';

export const useUserManagement = (searchQuery?: string) => {
  const queryClient = useQueryClient();

  // Fetch users list
  const { data, isLoading, error, refetch } = useQuery<UsersListData>({
    queryKey: ['admin', 'users', searchQuery],
    queryFn: async () => {
      const response = await apiClient.get('/api/admin/users', {
        params: { search: searchQuery },
      });
      return response.data;
    },
    staleTime: 30000,
  });

  // Update user status mutation
  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string | number; status: UserStatus }) => {
      const response = await apiClient.put(`/api/admin/users/${userId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  // Reset user password mutation
  const resetUserPassword = useMutation({
    mutationFn: async (userId: string | number) => {
      const response = await apiClient.post(`/api/admin/users/${userId}/reset-password`);
      return response.data;
    },
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: async (userId: string | number) => {
      const response = await apiClient.delete(`/api/admin/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  return {
    data,
    isLoading,
    error,
    refetch,
    updateUserStatus,
    resetUserPassword,
    deleteUser,
  };
};

export default useUserManagement;
