import React from 'react';
import { KanbanColumn } from './KanbanColumn';
import type { LeadCardData } from './LeadCard';

interface ColumnDef {
  id: string;
  title: string;
  dotColor: 'ai' | 'human' | 'success' | 'purple';
  leads: LeadCardData[];
  emptyIcon?: string;
  onCardClick?: (id: number) => void;
}

interface KanbanBoardProps {
  columns: ColumnDef[];
  onCardClick?: (id: number) => void;
  onDragStart?: (e: React.DragEvent, id: number) => void;
  onDragOver?: (e: React.DragEvent, colId: string) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent, colId: string) => void;
  dragOverColumn?: string | null;
  draggedLeadId?: number | null;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  onCardClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverColumn,
  draggedLeadId,
}) => {
  return (
    <div className="flex gap-gutter h-full min-h-[716px] pb-8 items-start">
      {columns.map(col => (
        <KanbanColumn
          key={col.id}
          title={col.title}
          count={col.leads.length}
          dotColor={col.dotColor}
          leads={col.leads}
          emptyIcon={col.emptyIcon}
          onCardClick={onCardClick}
          onDragStart={onDragStart}
          onDragOver={e => onDragOver?.(e, col.id)}
          onDragLeave={onDragLeave}
          onDrop={e => onDrop?.(e, col.id)}
          isDragOver={dragOverColumn === col.id}
          draggedLeadId={draggedLeadId}
        />
      ))}
      <button className="h-12 w-12 shrink-0 rounded-xl bg-surface border border-dashed border-border-low-contrast flex items-center justify-center text-outline hover:text-primary hover:border-primary transition-all">
        <span className="material-symbols-outlined" data-icon="add">add</span>
      </button>
    </div>
  );
};
