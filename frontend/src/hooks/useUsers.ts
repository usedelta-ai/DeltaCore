import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { User } from '../services/api';

export function useUsers(token: string | null) {
  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
    enabled: !!token,
    staleTime: 1000 * 30,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<User>) => api.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) =>
      api.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const createUser = (data: Partial<User>) => createMutation.mutateAsync(data);
  const updateUser = (id: number, data: Partial<User>) =>
    updateMutation.mutateAsync({ id, data });
  const deleteUser = (id: number) => deleteMutation.mutateAsync(id);

  const error = queryError ? (queryError as Error).message : null;

  return {
    users,
    loading,
    error,
    refetch,
    createUser,
    updateUser,
    deleteUser,
    isActionLoading:
      createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}
