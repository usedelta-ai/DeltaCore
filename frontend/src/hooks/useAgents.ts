import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Agent } from '../services/api';

export function useAgents(token: string | null) {
  const queryClient = useQueryClient();

  const {
    data: agents = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: () => api.getAgents(),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: (agentData: Partial<Agent>) => api.createAgent(agentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, agentData }: { id: number; agentData: Partial<Agent> }) =>
      api.updateAgent(id, agentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  const createAgent = async (agentData: Partial<Agent>) => {
    return createMutation.mutateAsync(agentData);
  };

  const updateAgent = async (id: number, agentData: Partial<Agent>) => {
    return updateMutation.mutateAsync({ id, agentData });
  };

  const deleteAgent = async (id: number) => {
    // Return void or promise to match previous behavior
    await deleteMutation.mutateAsync(id);
  };

  const error = queryError ? (queryError as Error).message : null;

  return {
    agents,
    loading,
    error,
    refetch,
    createAgent,
    updateAgent,
    deleteAgent,
  };
}
