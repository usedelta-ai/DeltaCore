import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Lead } from '../services/api';

export function useLeads(token: string | null, empresaId?: string | number, agentId?: string | number) {
  const queryClient = useQueryClient();

  const {
    data: leads = [],
    isLoading: loading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery<Lead[]>({
    queryKey: ['leads', { empresaId, agentId }],
    queryFn: () => api.getLeads(String(empresaId || ''), String(agentId || '')),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: (leadData: Partial<Lead>) => api.createLead(leadData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, leadData }: { id: number; leadData: Partial<Lead> }) =>
      api.updateLead(id, leadData),
    onMutate: async ({ id, leadData }) => {
      await queryClient.cancelQueries({ queryKey: ['leads'] });
      const previousLeads = queryClient.getQueryData<Lead[]>(['leads', { empresaId, agentId }]);
      queryClient.setQueryData<Lead[]>(['leads', { empresaId, agentId }], old =>
        old?.map(lead => lead.id === id ? { ...lead, ...leadData } : lead) ?? []
      );
      return { previousLeads };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousLeads) {
        queryClient.setQueryData(['leads', { empresaId, agentId }], context.previousLeads);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const createLead = async (leadData: Partial<Lead>) => {
    return createMutation.mutateAsync(leadData);
  };

  const updateLead = async (id: number, leadData: Partial<Lead>) => {
    return updateMutation.mutateAsync({ id, leadData });
  };

  const deleteLead = async (id: number) => {
    await deleteMutation.mutateAsync(id);
  };

  const error = queryError ? (queryError as Error).message : null;

  return {
    leads,
    loading,
    isFetching,
    error,
    refetch,
    createLead,
    updateLead,
    deleteLead,
  };
}
