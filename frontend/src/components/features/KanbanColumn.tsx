import React from 'react';
import { LeadCard } from './LeadCard';
import type { LeadCardData } from './LeadCard';
import { Skeleton } from '../ui/Skeleton';

interface KanbanColumnProps {
  title: string;
  count: number;
  totalValue?: number;
  dotColor: 'ai' | 'human' | 'success' | 'purple';
  leads: LeadCardData[];
  emptyIcon?: string;
  avatars?: Map<number, string | null>;
  onCardClick?: (id: number) => void;
  onPessoaClick?: (pessoaId: number) => void;
  onDragStart?: (e: React.DragEvent, id: number) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragOver?: boolean;
  draggedLeadId?: number | null;
  filterTransitioning?: boolean;
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
  totalValue = 0,
  dotColor,
  leads,
  emptyIcon = 'archive',
  avatars,
  onCardClick,
  onPessoaClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver = false,
  filterTransitioning = false,
}) => {
  return (
    <div
      className={`kanban-column flex flex-col flex-1 basis-0 min-w-0 bg-surface-container-low/50 rounded-xl p-3 border ${isDragOver ? 'border-primary' : 'border-transparent'}`}
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
        <div className="text-label-md text-status-success pl-4 font-bold">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
        </div>
      </div>
      <div className="space-y-stack-md overflow-visible">
        {filterTransitioning ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-surface border border-border-low-contrast rounded-xl p-stack-md relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-border-low-contrast" />
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col gap-1">
                  <Skeleton style={{ width: 60, height: 18, borderRadius: 6 }} />
                  <Skeleton style={{ width: 50, height: 12, margin: 0 }} />
                </div>
                <Skeleton style={{ width: 20, height: 20, borderRadius: 4 }} />
              </div>
              <Skeleton type="title" style={{ width: '70%', height: 16 }} />
              <div className="flex flex-wrap items-center gap-x-2 mt-1.5 mb-2">
                <Skeleton type="text" style={{ width: 60, height: 12, margin: 0 }} />
                <Skeleton type="text" style={{ width: 80, height: 12, margin: 0 }} />
              </div>
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border-low-contrast">
                <div className="flex items-center gap-1.5">
                  <Skeleton style={{ width: 16, height: 16, borderRadius: 9999 }} />
                  <Skeleton type="text" style={{ width: 45, height: 11, margin: 0 }} />
                </div>
                <Skeleton style={{ width: 24, height: 24, borderRadius: 9999 }} />
              </div>
            </div>
          ))
        ) : (
          leads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              avatarSrc={avatars?.get(lead.id)}
              onCardClick={onCardClick}
              onPessoaClick={onPessoaClick}
              onDragStart={onDragStart}
            />
          ))
        )}
        {!filterTransitioning && leads.length === 0 && (
          <div className="border-2 border-dashed border-border-low-contrast rounded-xl h-24 flex items-center justify-center text-on-surface-variant/30">
            <span className="material-symbols-outlined text-[32px]">{emptyIcon}</span>
          </div>
        )}
      </div>
    </div>
  );
};
