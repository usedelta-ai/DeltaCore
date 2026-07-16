import React from 'react';

interface ConversationDividerProps {
  type: 'human_takeover' | 'finalized' | 'concluded';
  timestamp?: string;
}

function formatDividerDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '';
  }
}

const config: Record<string, { label: string; icon: string; color: string; bg: string; dot: string }> = {
  human_takeover: {
    label: 'Transferido para atendimento humano',
    icon: '🤝',
    color: 'text-tertiary',
    bg: 'bg-tertiary-fixed/10',
    dot: 'bg-tertiary',
  },
  finalized: {
    label: 'Conversa finalizada',
    icon: '✅',
    color: 'text-status-success',
    bg: 'bg-status-success/5',
    dot: 'bg-status-success',
  },
  concluded: {
    label: 'Lead faturado',
    icon: '💰',
    color: 'text-status-success',
    bg: 'bg-status-success/5',
    dot: 'bg-status-success',
  },
};

export const ConversationDivider: React.FC<ConversationDividerProps> = ({ type, timestamp }) => {
  const cfg = config[type] || config.human_takeover;
  const formattedDate = formatDividerDate(timestamp);

  return (
    <div className="flex items-center gap-3 my-3 select-none">
      <div className="flex-1 h-px bg-border-low-contrast/60" />
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${cfg.bg}`}>
        <span className="text-sm">{cfg.icon}</span>
        <span className={`text-label-md font-label-md ${cfg.color} whitespace-nowrap`}>
          {cfg.label}
        </span>
        {formattedDate && (
          <>
            <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
            <span className="text-[10px] text-on-surface-variant whitespace-nowrap">
              {formattedDate}
            </span>
          </>
        )}
      </div>
      <div className="flex-1 h-px bg-border-low-contrast/60" />
    </div>
  );
};