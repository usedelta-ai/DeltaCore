import type { Lead, Agent } from '../services/api';
import type { LeadCardData } from '../components/features/LeadCard';

export function mapLeadToCardData(lead: Lead, agents: Agent[]): LeadCardData {
  const agent = agents.find(a => a.id === lead.agent_id);
  const empresa = agent?.empresa_name || '';

  let type: LeadCardData['type'] = 'human';
  let badgeVariant = 'warm';
  let badgeLabel = 'AQUECIDO';
  let timeAgo = formatTimeAgo(lead.created_at);
  let avatarLabel = '';
  let avatarType: 'ai' | 'human' | 'finished' | 'billed' = 'human';
  let avatarSrc: string | undefined;

  if (lead.status === 'NOVO') {
    type = 'ai';
    badgeVariant = 'high-intent';
    badgeLabel = 'NOVO';
    avatarType = 'ai';
    avatarLabel = 'Δ';
  } else if (lead.status === 'HUMANO') {
    type = 'human';
    badgeVariant = 'urgent';
    badgeLabel = 'HUMANO';
    if (agent?.status === 0) {
      badgeVariant = 'nurturing';
      badgeLabel = 'NUTRINDO';
    }
    if (lead.name) {
      avatarLabel = lead.name.charAt(0).toUpperCase();
    }
    avatarType = 'human';
  } else if (lead.status === 'FINALIZADO') {
    type = 'finished';
    badgeVariant = 'won';
    badgeLabel = 'FINALIZADO';
    if (lead.name) {
      avatarLabel = lead.name.charAt(0).toUpperCase();
    }
    avatarType = 'human';
  } else if (lead.status === 'CONCLUIDO') {
    type = 'billed';
    badgeVariant = 'invoiced';
    badgeLabel = 'FATURADO';
    if (lead.name) {
      avatarLabel = lead.name.charAt(0).toUpperCase();
    }
    avatarType = 'human';
  } else if (lead.status === 'CANCELADO') {
    type = 'finished';
    badgeVariant = 'cold';
    badgeLabel = 'CANCELADO';
    avatarType = 'human';
  }

  return {
    id: lead.id,
    name: lead.name || 'Sem nome',
    company: empresa,
    badge: { label: badgeLabel, variant: badgeVariant },
    type,
    timeAgo,
    avatarLabel,
    avatarType,
    avatarSrc,
    value: lead.value,
    takenMotive: lead.taken_motive,
    phone: lead.remote_jid_alt?.replace('@s.whatsapp.net', '') || null,
    pessoa_id: lead.pessoa_id,
    finalized_by_name: lead.finalized_by_name,
  };
}

function formatTimeAgo(dateString: string | null | undefined): string {
  if (!dateString) return 'Agora';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('pt-BR');
}

export function getColumnForStatus(status: Lead['status']): string {
  switch (status) {
    case 'NOVO': return 'ai-automated';
    case 'HUMANO': return 'human-attended';
    case 'FINALIZADO': return 'finished';
    case 'CONCLUIDO': return 'billed';
    case 'CANCELADO': return 'finished';
    default: return 'ai-automated';
  }
}

export function getStatusForColumn(columnId: string): Lead['status'] {
  switch (columnId) {
    case 'ai-automated': return 'NOVO';
    case 'human-attended': return 'HUMANO';
    case 'finished': return 'FINALIZADO';
    case 'billed': return 'CONCLUIDO';
    default: return 'NOVO';
  }
}