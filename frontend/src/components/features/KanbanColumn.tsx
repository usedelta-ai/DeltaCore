import React from 'react';
import { LeadCard } from './LeadCard';
import type { LeadCardData } from './LeadCard';

interface KanbanColumnProps {
  title: string;
  count: number;
  dotColor: 'ai' | 'human' | 'success' | 'purple';
  leads: LeadCardData[];
  emptyIcon?: string;
  onCardClick?: (id: number) => void;
  onDragStart?: (e: React.DragEvent, id: number) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragOver?: boolean;
  draggedLeadId?: number | null;
}

const dotColors: Record<string, string> = {
  ai: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse',
  human: 'bg-secondary',
  success: 'bg-status-success',
  purple: 'bg-primary-container shadow-[0_0_8px_rgba(88,43,232,0.6)]',
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  count,
  dotColor,
  leads,
  emptyIcon = 'archive',
  onCardClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver = false,
}) => {
  const totalValue = leads.reduce((acc, lead) => acc + Number(lead.value || 0), 0);

  return (
    <div
      className={`kanban-column flex flex-col flex-1 bg-surface-container-low/50 rounded-xl p-4 border ${isDragOver ? 'border-primary' : 'border-transparent'}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex flex-col mb-4 px-2 gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dotColors[dotColor]}`} />
            <h2 className="font-headline-md text-body-md text-on-surface font-bold">{title}</h2>
          </div>
          <span className="bg-surface-container-high px-2 py-0.5 rounded-full text-label-md text-on-surface-variant">{count}</span>
        </div>
        {totalValue > 0 && (
          <div className="text-body-sm font-bold text-status-success pl-4">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
          </div>
        )}
      </div>
      <div className="space-y-stack-md overflow-y-auto max-h-[calc(100vh-320px)] pr-2">
        {leads.map(lead => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onCardClick={onCardClick}
            onDragStart={onDragStart}
          />
        ))}
        {leads.length === 0 && (
          <div className="border-2 border-dashed border-border-low-contrast rounded-xl h-24 flex items-center justify-center text-on-surface-variant/30">
            <span className="material-symbols-outlined text-[32px]">{emptyIcon}</span>
          </div>
        )}
      </div>
    </div>
  );
};
