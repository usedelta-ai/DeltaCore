import React from 'react';

export interface LeadCardData {
  id: number;
  name: string;
  company: string;
  badge: { label: string; variant: string };
  type: 'ai' | 'human' | 'finished' | 'billed';
  timeAgo: string;
  avatarLabel: string;
  avatarType: 'ai' | 'human';
  avatarSrc?: string;
  value?: number | null;
  takenMotive?: string | null;
  phone?: string | null;
  pessoa_id?: number | null;
  finalized_by_name?: string;
}

interface LeadCardProps {
  lead: LeadCardData;
  onCardClick?: (id: number) => void;
  onDragStart?: (e: React.DragEvent, id: number) => void;
  onPessoaClick?: (pessoaId: number) => void;
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
    leftBorder: 'bg-blue-500',
    icon: 'smart_toy',
    iconColor: 'text-blue-500',
    opacity: '',
    glow: 'card-glow-ai shadow-[0_0_15px_rgba(59,130,246,0.15)]',
  },
  human: {
    leftBorder: 'bg-secondary',
    icon: 'person',
    iconColor: 'text-secondary',
    opacity: '',
    glow: '',
  },
  finished: {
    leftBorder: 'bg-primary',
    icon: 'check_circle',
    iconColor: 'text-primary',
    opacity: 'opacity-75',
    glow: 'shadow-[0_0_10px_rgba(88,43,232,0.08)]',
  },
  billed: {
    leftBorder: 'bg-status-success',
    icon: 'receipt_long',
    iconColor: 'text-status-success',
    opacity: '',
    glow: 'shadow-[0_0_10px_rgba(34,197,94,0.1)]',
  },
};

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onCardClick, onDragStart, onPessoaClick }) => {
  const type = typeConfig[lead.type];
  const badgeClass = badgeStyles[lead.badge.variant] || 'bg-surface-container-highest text-on-surface-variant';
  const avatarBg = lead.avatarType === 'ai' ? 'bg-blue-500' : 'bg-secondary';

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
      <div className="flex justify-between items-center mb-0.5">
        <h3 className="font-headline-md text-body-md text-on-surface">{lead.name}</h3>
        {lead.pessoa_id && (
          <button
            onClick={e => {
              e.stopPropagation();
              onPessoaClick?.(lead.pessoa_id!);
            }}
            title="Ver/Editar Cadastro de Pessoa"
            className="w-7 h-7 flex items-center justify-center rounded-full bg-primary/5 border border-primary/10 hover:bg-primary/10 hover:border-primary/30 text-primary transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">contact_page</span>
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-body-sm text-on-surface-variant mb-2">
        {lead.company && <span>{lead.company}</span>}
        {lead.company && lead.phone && <span className="opacity-40">•</span>}
        {lead.phone && <span className="font-mono text-[11px]">{lead.phone}</span>}
      </div>

      {lead.type === 'human' && lead.takenMotive && (
        <div className="mt-2.5 mb-3 bg-secondary-container/10 border border-secondary/20 p-2.5 rounded-lg text-secondary">
          <div className="flex items-center gap-1 mb-1">
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
            <span className="font-bold text-[8.5px] uppercase tracking-wider">Motivo da Transferência</span>
          </div>
          <p className="text-[11px] leading-relaxed text-on-surface-variant line-clamp-2">{lead.takenMotive}</p>
        </div>
      )}

      {(lead.type === 'finished' || lead.type === 'billed') && lead.finalized_by_name && (
        <div className="mt-2.5 mb-3 bg-primary/5 border border-primary/20 p-2.5 rounded-lg text-primary">
          <div className="flex items-center gap-1 mb-1">
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span className="font-bold text-[8.5px] uppercase tracking-wider">Finalizado por</span>
          </div>
          <p className="text-[11px] leading-relaxed text-on-surface-variant font-semibold">{lead.finalized_by_name}</p>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border-low-contrast">
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
