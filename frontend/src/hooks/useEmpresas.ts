import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Empresa } from '../services/api';

export function useEmpresas(token: string | null) {
  const queryClient = useQueryClient();

  const {
    data: empresas = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<Empresa[]>({
    queryKey: ['empresas'],
    queryFn: () => api.getEmpresas(),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: ({ name, logo }: { name: string; logo: string | null }) =>
      api.createEmpresa({ name, logo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, logo }: { id: number; name: string; logo?: string | null }) =>
      api.updateEmpresa(id, { name, logo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteEmpresa(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });

  const createEmpresa = async (name: string, logo: string | null) => {
    return createMutation.mutateAsync({ name, logo });
  };

  const updateEmpresa = async (id: number, name: string, logo?: string | null) => {
    return updateMutation.mutateAsync({ id, name, logo });
  };

  const deleteEmpresa = async (id: number) => {
    await deleteMutation.mutateAsync(id);
  };

  const error = queryError ? (queryError as Error).message : null;

  return {
    empresas,
    loading,
    error,
    refetch,
    createEmpresa,
    updateEmpresa,
    deleteEmpresa,
  };
}
