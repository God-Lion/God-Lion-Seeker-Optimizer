import { useMutation, useQueryClient } from '@tanstack/react-query';
import { startAutomatedSubmission } from '../services/automationService';

export const useAutomatedSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation((jobId: number) => startAutomatedSubmission(jobId), {
    onSuccess: () => {
      // Invalidate and refetch the automation status and history queries
      // so that the UI is updated with the latest data.
      queryClient.invalidateQueries(['automationStatus']);
      queryClient.invalidateQueries(['automationHistory']);
    },
  });
};
