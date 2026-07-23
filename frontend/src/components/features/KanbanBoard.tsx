import React, { useMemo } from 'react';
import { KanbanColumn } from './KanbanColumn';
import type { LeadCardData } from './LeadCard';
import { useBulkAvatars } from '../../hooks/useBulkAvatars';

interface ColumnDef {
  id: string;
  title: string;
  dotColor: 'ai' | 'human' | 'success' | 'purple';
  leads: LeadCardData[];
  emptyIcon?: string;
  totalCount?: number;
  totalValue?: number;
  onCardClick?: (id: number) => void;
}

interface KanbanBoardProps {
  columns: ColumnDef[];
  onCardClick?: (id: number) => void;
  onNewLead?: () => void;
  onDragStart?: (e: React.DragEvent, id: number) => void;
  onDragOver?: (e: React.DragEvent, colId: string) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent, colId: string) => void;
  dragOverColumn?: string | null;
  draggedLeadId?: number | null;
  onPessoaClick?: (pessoaId: number) => void;
  filterTransitioning?: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  onCardClick,
  onNewLead,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverColumn,
  draggedLeadId,
  onPessoaClick,
  filterTransitioning = false,
}) => {
  const allLeadIds = useMemo(() =>
    columns.flatMap(col => col.leads.map(l => l.id)),
    [columns]
  );

  const avatars = useBulkAvatars(allLeadIds);

  return (
    <div className="flex gap-3.5 w-full min-w-[900px] pb-8 items-start">
      {columns.map(col => (
        <KanbanColumn
          key={col.id}
          title={col.title}
          count={col.leads.length}
          totalValue={col.totalValue}
          dotColor={col.dotColor}
          leads={col.leads}
          emptyIcon={col.emptyIcon}
          avatars={avatars}
          onCardClick={onCardClick}
          onPessoaClick={onPessoaClick}
          onDragStart={onDragStart}
          onDragOver={e => onDragOver?.(e, col.id)}
          onDragLeave={onDragLeave}
          onDrop={e => onDrop?.(e, col.id)}
          isDragOver={dragOverColumn === col.id}
          draggedLeadId={draggedLeadId}
          filterTransitioning={filterTransitioning}
        />
      ))}
      <button onClick={onNewLead} className="h-12 w-12 shrink-0 rounded-xl bg-surface border border-dashed border-border-low-contrast flex items-center justify-center text-outline hover:text-primary hover:border-primary transition-all">
        <span className="material-symbols-outlined" data-icon="add">add</span>
      </button>
    </div>
  );
};
