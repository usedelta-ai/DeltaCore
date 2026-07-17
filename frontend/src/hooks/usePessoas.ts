import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Pessoa } from '../services/api';

export function usePessoas() {
  const queryClient = useQueryClient();

  const {
    data: pessoas = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<Pessoa[]>({
    queryKey: ['pessoas'],
    queryFn: () => api.getPessoas(),
    staleTime: 1000 * 30,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Pessoa>) => api.createPessoa(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Pessoa> }) =>
      api.updatePessoa(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      queryClient.invalidateQueries({ queryKey: ['pessoa', variables.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deletePessoa(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
    },
  });

  const createPessoa = (data: Partial<Pessoa>) => createMutation.mutateAsync(data);
  const updatePessoa = (id: number, data: Partial<Pessoa>) =>
    updateMutation.mutateAsync({ id, data });
  const deletePessoa = (id: number) => deleteMutation.mutateAsync(id);

  const error = queryError ? (queryError as Error).message : null;

  return {
    pessoas,
    loading,
    error,
    refetch,
    createPessoa,
    updatePessoa,
    deletePessoa,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
