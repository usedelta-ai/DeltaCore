import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { FollowUpSetting } from '../services/api';

export function useFollowUps(token: string | null) {
  const queryClient = useQueryClient();

  const {
    data: followUps = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<FollowUpSetting[]>({
    queryKey: ['followUps'],
    queryFn: () => api.getFollowUps(),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<FollowUpSetting>) => api.createFollowUp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FollowUpSetting> }) =>
      api.updateFollowUp(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteFollowUp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
    },
  });

  const createFollowUp = async (data: Partial<FollowUpSetting>) => {
    return createMutation.mutateAsync(data);
  };

  const updateFollowUp = async (id: number, data: Partial<FollowUpSetting>) => {
    return updateMutation.mutateAsync({ id, data });
  };

  const deleteFollowUp = async (id: number) => {
    await deleteMutation.mutateAsync(id);
  };

  const error = queryError ? (queryError as Error).message : null;

  return {
    followUps,
    loading,
    error,
    refetch,
    createFollowUp,
    updateFollowUp,
    deleteFollowUp,
  };
}
