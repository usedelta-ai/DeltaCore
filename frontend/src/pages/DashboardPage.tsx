import React, { useState, useMemo } from 'react';
import { FilterBar } from '../components/features/FilterBar';
import { KanbanBoard } from '../components/features/KanbanBoard';
import type { LeadCardData } from '../components/features/LeadCard';
import type { Lead, Agent, Empresa } from '../services/api';
import { mapLeadToCardData, getStatusForColumn } from '../utils/leadMapper';

interface DashboardPageProps {
  onLeadClick?: (leadId: number) => void;
  onNewLead?: () => void;
  leads: Lead[];
  agents: Agent[];
  empresas: Empresa[];
  updateLead?: (id: number, data: Partial<Lead>) => Promise<any>;
  filterEmpresaId?: string | number;
  filterAgentId?: string | number;
  onFilterEmpresaChange?: (val: string | number) => void;
  onFilterAgentChange?: (val: string | number) => void;
}

function getColumnIdFromBadge(badgeLabel: string): string {
  switch (badgeLabel) {
    case 'NOVO': return 'ai-automated';
    case 'HUMANO':
    case 'NURTURING': return 'human-attended';
    case 'FINALIZADO':
    case 'CANCELADO': return 'finished';
    case 'FATURADO': return 'billed';
    default: return 'ai-automated';
  }
}

function buildColumns(leads: LeadCardData[]) {
  const cols = [
    { id: 'ai-automated', title: 'Lead em atendimento automatizado', dotColor: 'ai' as const },
    { id: 'human-attended', title: 'Em Atendimento', dotColor: 'human' as const },
    { id: 'finished', title: 'Finalizados', dotColor: 'success' as const, emptyIcon: 'archive' },
    { id: 'billed', title: 'Faturado', dotColor: 'success' as const, emptyIcon: 'add_shopping_cart' },
  ] as const;

  return cols.map(col => ({
    ...col,
    leads: leads.filter(l => getColumnIdFromBadge(l.badge.label) === col.id),
  }));
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onLeadClick,
  onNewLead: _onNewLead,
  leads,
  agents,
  empresas,
  updateLead,
  filterEmpresaId = '',
  filterAgentId = '',
  onFilterEmpresaChange,
  onFilterAgentChange,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const cardData = useMemo(() =>
    leads.map(lead => mapLeadToCardData(lead, agents)),
    [leads, agents]
  );

  const columns = useMemo(() => buildColumns(cardData), [cardData]);

  const companyOptions = useMemo(() =>
    empresas.map(e => ({ value: String(e.id), label: e.name })),
    [empresas]
  );

  const agentOptions = useMemo(() =>
    agents
      .filter(a => filterEmpresaId === '' || a.empresa_id === Number(filterEmpresaId))
      .map(a => ({ value: String(a.id), label: a.name })),
    [agents, filterEmpresaId]
  );

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('text/plain', id.toString());
    setDraggedLeadId(id);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const leadIdStr = e.dataTransfer.getData('text/plain');
    const leadId = Number(leadIdStr);
    if (!leadId || !updateLead) return;

    const newStatus = getStatusForColumn(columnId);
    try {
      await updateLead(leadId, { status: newStatus });
    } catch (err) {
      console.error('Erro ao atualizar status do lead:', err);
    }
  };

  const handleCardClick = (id: number) => {
    onLeadClick?.(id);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] overflow-x-auto">
      <FilterBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedCompany={String(filterEmpresaId)}
        selectedAgent={String(filterAgentId)}
        onCompanyChange={val => onFilterEmpresaChange?.(val)}
        onAgentChange={val => onFilterAgentChange?.(val)}
        companyOptions={companyOptions}
        agentOptions={agentOptions}
      />

      {viewMode === 'kanban' ? (
        <KanbanBoard
          columns={columns}
          onCardClick={handleCardClick}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          dragOverColumn={dragOverColumn}
          draggedLeadId={draggedLeadId}
        />
      ) : (
        <div className="text-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl mb-4 block">list</span>
          <p>Visualização em lista em breve</p>
        </div>
      )}
    </div>
  );
};
