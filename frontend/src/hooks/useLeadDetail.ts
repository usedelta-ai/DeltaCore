import { useState, useEffect, useCallback, useRef } from 'react';
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

function mergeMessages(a: ChatMessage[], b: ChatMessage[]): ChatMessage[] {
  const seen = new Set<string | number>();
  const merged: ChatMessage[] = [];
  for (const msg of [...a, ...b]) {
    if (!seen.has(msg.id)) {
      seen.add(msg.id);
      merged.push(msg);
    }
  }
  return merged.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function useLeadDetail(leadId?: number) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLead = useCallback(async (showLoading = false) => {
    if (!leadId) return;
    if (showLoading) setLoading(true);
    setError(null);
    try {
      // 1. Fetch core lead details first so UI panels render immediately
      const leadRes = await api.getLeadById(leadId);
      setLead(leadRes);
      if (showLoading) setLoading(false); // Stop loading indicator early as layout is now visible

      // 2. Fetch heavier chat history and timeline logs in parallel asynchronously
      Promise.all([
        api.getLeadHistory(leadId),
        api.getLeadAgentHistory(leadId)
      ]).then(([historyRes, agentHistoryRes]) => {
        // Merge both message sources, deduplicated by id
        const merged = mergeMessages(
          historyRes.messages || [],
          agentHistoryRes.messages || []
        );
        setChatHistory(merged);

        // Build timeline events (excluding chat messages to show only system changes/transitions/takeovers)
        const events: TimelineEvent[] = [];

        // Extract system events (takeovers, finalizations and field changes) from agentHistoryRes combined messages
        const dbSystemEvents = merged.filter((m: any) => m.type === 'system_event' || m.role === 'system_event');
        
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
            label: sev.event === 'lead_created' ? 'Lead Criado' :
                   sev.event === 'human_takeover' ? 'Atendimento Humano' :
                   sev.event === 'lead_finalized' ? 'Finalização' : 'Alteração de Campo',
            icon,
            description: sev.content,
          });
        });

        // If no creation event was registered or returned, add fallback from lead info
        const hasCreationEvent = events.some(e => e.label === 'Lead Criado');
        if (!hasCreationEvent && leadRes.created_at) {
          events.push({
            id: `created-${leadRes.id}`,
            type: 'ai',
            timestamp: leadRes.created_at,
            label: 'Lead Criado',
            icon: 'person_add',
            description: `O lead foi adicionado ao sistema.`,
          });
        }

        setTimelineEvents(events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
      }).catch(err => {
        console.error("Erro ao buscar histórico/chat do lead:", err);
      });

    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes do lead');
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLead(true);
  }, [leadId, fetchLead]);

  // Polling for new messages (when lead is not finalized)
  useEffect(() => {
    if (!leadId || !lead || lead.status === 'FINALIZADO' || lead.status === 'CONCLUIDO') {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    pollingRef.current = setInterval(async () => {
      try {
        const [historyRes, agentHistoryRes] = await Promise.all([
          api.getLeadHistory(leadId),
          api.getLeadAgentHistory(leadId),
        ]);
        const merged = mergeMessages(
          historyRes.messages || [],
          agentHistoryRes.messages || []
        );
        setChatHistory(prev => {
          if (prev.length !== merged.length) return merged;
          const a = prev[prev.length - 1];
          const b = merged[merged.length - 1];
          if (!a || !b || a.id !== b.id || a.content !== b.content) return merged;
          return prev;
        });
      } catch (_) {}
    }, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [leadId, lead?.status]);

  const refetch = useCallback(() => {
    fetchLead(false);
  }, [fetchLead]);

  return { lead, chatHistory, timelineEvents, loading, error, refetch };
}
