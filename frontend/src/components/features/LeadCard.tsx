import React from 'react';

export interface LeadCardData {
  id: number;
  name: string;
  company: string;
  badge: { label: string; variant: string };
  type: 'ai' | 'human' | 'finished';
  timeAgo: string;
  avatarLabel: string;
  avatarType: 'ai' | 'human';
  avatarSrc?: string;
  value?: number | null;
}

interface LeadCardProps {
  lead: LeadCardData;
  onCardClick?: (id: number) => void;
  onDragStart?: (e: React.DragEvent, id: number) => void;
}

const badgeStyles: Record<string, string> = {
  'high-intent': 'bg-primary-fixed text-on-primary-fixed',
  'warm': 'bg-surface-container-highest text-on-surface-variant',
  'urgent': 'bg-tertiary-fixed text-on-tertiary-fixed',
  'nurturing': 'bg-surface-container-highest text-on-surface-variant',
  'won': 'bg-status-success/10 text-status-success',
  'invoiced': 'bg-status-success/10 text-status-success',
  'cold': 'bg-surface-container-highest text-on-surface-variant',
};

const typeConfig = {
  ai: {
    leftBorder: 'bg-ai-accent',
    icon: 'smart_toy',
    iconColor: 'text-ai-accent',
    opacity: '',
    glow: 'card-glow-ai shadow-[0_0_15px_rgba(88,43,232,0.1)]',
  },
  human: {
    leftBorder: 'bg-secondary',
    icon: 'person',
    iconColor: 'text-secondary',
    opacity: '',
    glow: '',
  },
  finished: {
    leftBorder: 'bg-status-success',
    icon: 'check_circle',
    iconColor: 'text-status-success',
    opacity: 'opacity-75',
    glow: '',
  },
};

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onCardClick, onDragStart }) => {
  const type = typeConfig[lead.type];
  const badgeClass = badgeStyles[lead.badge.variant] || 'bg-surface-container-highest text-on-surface-variant';
  const avatarBg = lead.avatarType === 'ai' ? 'bg-ai-accent' : 'bg-secondary';

  return (
    <div
      className={`bg-surface border border-border-low-contrast rounded-xl p-stack-md ${type.glow} hover:shadow-lg transition-all cursor-grab active:cursor-grabbing relative overflow-hidden group ${type.opacity}`}
      style={{ transform: 'scale(1) rotate(0deg)' }}
      draggable
      onDragStart={e => onDragStart?.(e, lead.id)}
      onClick={() => onCardClick?.(lead.id)}
      onMouseDown={e => {
        e.currentTarget.style.transform = 'scale(0.98) rotate(1deg)';
      }}
      onMouseUp={e => {
        e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
      }}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${type.leftBorder}`} />
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col gap-1">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider ${badgeClass}`}>
            {lead.badge.label}
          </span>
          {lead.value !== undefined && lead.value !== null && lead.value > 0 && (
            <span className="text-[11px] font-bold text-status-success">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)}
            </span>
          )}
        </div>
        <span
          className={`material-symbols-outlined ${type.iconColor} text-[20px]`}
          data-icon={type.icon}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {type.icon}
        </span>
      </div>
      <h3 className="font-headline-md text-body-md text-on-surface mb-1">{lead.name}</h3>
      <p className="text-body-sm text-on-surface-variant mb-3">{lead.company}</p>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-low-contrast">
        <div className="flex items-center gap-1.5 text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]" data-icon="schedule">schedule</span>
          <span className="text-label-md uppercase">{lead.timeAgo}</span>
        </div>
        <div className="flex -space-x-2">
          <div className={`w-6 h-6 rounded-full border-2 border-surface ${avatarBg} flex items-center justify-center text-[10px] text-white font-bold`}>
            {lead.avatarType === 'ai' ? (
              'Δ'
            ) : lead.avatarSrc ? (
              <img src={lead.avatarSrc} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              lead.avatarLabel
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
