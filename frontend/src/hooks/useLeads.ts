import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Lead } from '../services/api';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
const STALE_TIME = 12_000;
const PAGE_SIZE = 50;
const KANBAN_PAGE_SIZE = 500;

const REFRESH_INTERVAL = 60_000;

function getCurrentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function useLeads(token: string | null, empresaId?: string | number, agentId?: string | number) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [month, setMonth] = useState(getCurrentMonth);
  const [page, setPage] = useState(1);
  const [filterVersion, setFilterVersion] = useState(0);
  const dataVersionRef = useRef(0);

  const isKanbanView = !!month;
  const pageSize = isKanbanView ? KANBAN_PAGE_SIZE : PAGE_SIZE;

  const queryKey = ['leads', { empresaId, agentId, search: searchTerm, month, page, pageSize }];

  const {
    data,
    isLoading: loading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => api.getLeads(
      String(empresaId || ''),
      String(agentId || ''),
      searchTerm || undefined,
      page,
      pageSize,
      undefined,
      month,
    ),
    enabled: !!token,
    staleTime: STALE_TIME,
    refetchInterval: REFRESH_INTERVAL,
  });

  useEffect(() => {
    if (data) {
      dataVersionRef.current = filterVersion;
    }
  }, [data, filterVersion]);

  const isTransitioning = filterVersion !== dataVersionRef.current;

  const leads = useMemo(() => {
    if (isTransitioning) return [];
    const all = data?.data || [];
    const seen = new Set<number>();
    return all.filter(l => {
      if (seen.has(l.id)) return false;
      seen.add(l.id);
      return true;
    });
  }, [data, isTransitioning]);

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  const summaryQuery = useQuery({
    queryKey: ['leads-summary', { empresaId, agentId, search: searchTerm, month }],
    queryFn: () => api.getLeadsSummary(
      String(empresaId || ''),
      String(agentId || ''),
      searchTerm || undefined,
      month,
    ),
    enabled: !!token,
    staleTime: STALE_TIME,
    refetchInterval: REFRESH_INTERVAL,
  });

  const summary = summaryQuery.data;

  const resetPagination = useCallback((search?: string) => {
    if (search !== undefined) setSearchTerm(search);
    setFilterVersion(v => v + 1);
  }, []);

  const changeMonth = useCallback((newMonth: string) => {
    setMonth(newMonth);
    setPage(1);
    setFilterVersion(v => v + 1);
  }, []);

  const changePage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const createMutation = useMutation({
    mutationFn: (leadData: Partial<Lead>) => api.createLead(leadData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-summary'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, leadData }: { id: number; leadData: Partial<Lead> }) =>
      api.updateLead(id, leadData),
    onMutate: async ({ id, leadData }) => {
      await queryClient.cancelQueries({ queryKey: ['leads'] });
      const previousData = queryClient.getQueryData<{ data: Lead[]; total: number }>(queryKey);
      queryClient.setQueryData<{ data: Lead[]; total: number }>(queryKey, old => {
        if (!old) return old;
        return { ...old, data: old.data.map(lead => lead.id === id ? { ...lead, ...leadData } : lead) };
      });
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSuccess: (updatedLead) => {
      queryClient.setQueriesData<{ data: Lead[]; total: number }>({ queryKey: ['leads'] }, old => {
        if (!old) return old;
        return { ...old, data: old.data.map(lead => lead.id === updatedLead.id ? { ...lead, ...updatedLead } : lead) };
      });
      queryClient.setQueryData<Lead>(['lead', updatedLead.id], updatedLead);
      queryClient.invalidateQueries({ queryKey: ['leads-summary'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-summary'] });
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
    total: data?.total || 0,
    summary,
    loading,
    isFetching,
    isTransitioning,
    error,
    refetch,
    createLead,
    updateLead,
    deleteLead,
    searchTerm,
    setSearchTerm: resetPagination,
    month,
    setMonth: changeMonth,
    page,
    totalPages,
    changePage,
  };
}
