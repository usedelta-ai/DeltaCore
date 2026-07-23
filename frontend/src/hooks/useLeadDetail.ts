import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { api } from '../services/api';
import type { Lead, ChatMessage } from '../services/api';

export type TimelineEvent = {
  id: string;
  type: 'ai' | 'human' | 'system' | 'add';
  timestamp: string;
  label: string;
  icon?: string;
  avatarSrc?: string;
  description?: string;
};



function buildTimelineEvents(merged: ChatMessage[], lead: Lead): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  const dbSystemEvents = merged.filter(
    (m: any) => m.type === 'system_event' || m.role === 'system_event'
  );

  dbSystemEvents.forEach((sev: any) => {
    let icon = 'info';
    let type: 'ai' | 'human' | 'system' = 'system';

    if (sev.event === 'human_takeover') {
      icon = 'person';
      type = 'human';
    } else if (sev.event === 'lead_finalized') {
      icon = 'check_circle';
      type = 'system';
    } else if (sev.event === 'lead_created') {
      icon = 'person_add';
      type = 'ai';
    } else if (sev.event === 'field_change') {
      icon = 'edit_note';
      type = 'system';
    }

    events.push({
      id: String(sev.id),
      type,
      timestamp: sev.createdAt || sev.timestamp,
      label:
        sev.event === 'lead_created'
          ? 'Lead Criado'
          : sev.event === 'human_takeover'
          ? 'Atendimento Humano'
          : sev.event === 'lead_finalized'
          ? 'Finalização'
          : 'Alteração de Campo',
      icon,
      description: sev.content,
    });
  });

  const hasCreationEvent = events.some((e) => e.label === 'Lead Criado');
  if (!hasCreationEvent && lead.created_at) {
    events.push({
      id: `created-${lead.id}`,
      type: 'ai',
      timestamp: lead.created_at,
      label: 'Lead Criado',
      icon: 'person_add',
      description: `O lead foi adicionado ao sistema.`,
    });
  }

  return events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

export function useLeadDetail(leadId?: number) {
  const queryClient = useQueryClient();

  // Query 1: Core lead details — fast fetch, no polling
  const {
    data: lead = null,
    isLoading: loadingLead,
    error: leadError,
  } = useQuery<Lead | null>({
    queryKey: ['lead', leadId],
    queryFn: () => (leadId ? api.getLeadById(leadId) : Promise.resolve(null)),
    enabled: !!leadId,
    staleTime: 1000 * 15,
  });

  // Query 2: Chat history — polls every 3s for active leads, stops when finalized
  const isActive =
    lead !== null &&
    lead.status !== 'FINALIZADO' &&
    lead.status !== 'CONCLUIDO' &&
    lead.status !== 'CANCELADO';

  const {
    data: historyData,
    isLoading: loadingHistory,
  } = useQuery({
    queryKey: ['leadHistory', leadId],
    queryFn: async () => {
      if (!leadId) return { chatHistory: [] };
      const historyRes = await api.getLeadAgentHistory(leadId);
      return { chatHistory: historyRes.messages || [] };
    },
    enabled: !!leadId,
    // Poll every 3s for active leads; stop polling for finalized leads
    refetchInterval: isActive ? 3000 : false,
    staleTime: 0,
  });

  const chatHistory = historyData?.chatHistory ?? [];
  const timelineEvents = lead ? buildTimelineEvents(chatHistory, lead) : [];

  const loading = loadingLead;
  const error = leadError ? (leadError as Error).message : null;

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
    queryClient.invalidateQueries({ queryKey: ['leadHistory', leadId] });
  }, [queryClient, leadId]);

  return { lead, chatHistory, timelineEvents, loading, loadingHistory, error, refetch };
}
