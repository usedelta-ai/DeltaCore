import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { FilterBar } from '../components/features/FilterBar';
import { KanbanBoard } from '../components/features/KanbanBoard';
import { LeadListView } from '../components/features/LeadListView';
import { SkeletonView } from '../components/ui/SkeletonView';
import type { LeadCardData } from '../components/features/LeadCard';
import type { Lead, Agent, Empresa } from '../services/api';
import { mapLeadToCardData, getStatusForColumn } from '../utils/leadMapper';

const REFRESH_INTERVAL = 4;

interface DashboardPageProps {
  onLeadClick?: (leadId: number) => void;
  onNewLead?: () => void;
  leads: Lead[];
  agents: Agent[];
  empresas: Empresa[];
  updateLead?: (id: number, data: Partial<Lead>) => Promise<any>;
  onRefresh?: () => void;
  filterEmpresaId?: string | number;
  filterAgentId?: string | number;
  onFilterEmpresaChange?: (val: string | number) => void;
  onFilterAgentChange?: (val: string | number) => void;
  onPessoaClick?: (pessoaId: number) => void;
  loading?: boolean;
  isFetching?: boolean;
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
    { id: 'finished', title: 'Finalizados', dotColor: 'purple' as const, emptyIcon: 'archive' },
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
  onRefresh,
  filterEmpresaId = '',
  filterAgentId = '',
  onFilterEmpresaChange,
  onFilterAgentChange,
  onPessoaClick,
  loading = false,
  isFetching = false,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [hasLoadedForCurrentAgent, setHasLoadedForCurrentAgent] = useState(false);
  const [autoRefreshPaused, setAutoRefreshPaused] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isInitialAgentLoad = loading && !hasLoadedForCurrentAgent;

  useEffect(() => {
    setHasLoadedForCurrentAgent(false);
  }, [filterAgentId, filterEmpresaId]);

  useEffect(() => {
    if (loading || isFetching) return;
    if (!hasLoadedForCurrentAgent) {
      setHasLoadedForCurrentAgent(true);
      setCountdown(REFRESH_INTERVAL);
    }
  }, [loading, isFetching, hasLoadedForCurrentAgent]);

  useEffect(() => {
    setAutoRefreshPaused(isInitialAgentLoad);
  }, [isInitialAgentLoad]);

  const triggerRefresh = useCallback(async () => {
    if (!onRefresh) return;
    if (!hasLoadedForCurrentAgent) return;
    setIsRefreshing(true);
    setCountdown(REFRESH_INTERVAL);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  }, [onRefresh, hasLoadedForCurrentAgent]);

  useEffect(() => {
    if (autoRefreshPaused) return;
    setCountdown(REFRESH_INTERVAL);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          triggerRefresh();
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [triggerRefresh, autoRefreshPaused]);

  const cardData = useMemo(() => {
    let result = leads.map(lead => mapLeadToCardData(lead, agents));

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(card => {
        const nameMatch = card.name.toLowerCase().includes(lower);
        const phoneMatch = card.phone ? card.phone.toLowerCase().includes(lower) : false;
        return nameMatch || phoneMatch;
      });
    }

    if (selectedStatus) {
      result = result.filter(card => card.badge.label === selectedStatus);
    }

    return result;
  }, [leads, agents, searchTerm, selectedStatus]);

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

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const leadIdStr = e.dataTransfer.getData('text/plain');
    const leadId = Number(leadIdStr);
    if (!leadId || !updateLead) return;

    const newStatus = getStatusForColumn(columnId);
    const statusMap: Record<string, string> = {
      'NOVO': 'Novo Lead',
      'HUMANO': 'Em Atendimento',
      'FINALIZADO': 'Finalizado',
      'CONCLUIDO': 'Faturado',
      'CANCELADO': 'Cancelado'
    };
    const statusText = statusMap[newStatus] || newStatus;
    const motive = `Alterado para ${statusText} via Kanban`;

    updateLead(leadId, { status: newStatus, taken_motive: motive });
  };

  const handleCardClick = (id: number) => {
    onLeadClick?.(id);
  };


  return (
    <div className="min-h-[calc(100vh-64px)] pb-8">
      <div className="flex items-center">
        <FilterBar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedCompany={String(filterEmpresaId)}
          selectedAgent={String(filterAgentId)}
          onCompanyChange={val => onFilterEmpresaChange?.(val)}
          onAgentChange={val => onFilterAgentChange?.(val)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          companyOptions={companyOptions}
          agentOptions={agentOptions}
          countdown={countdown}
          isRefreshing={isRefreshing}
          onRefresh={triggerRefresh}
        />
      </div>

      {isInitialAgentLoad ? (
        <SkeletonView tab={viewMode === 'kanban' ? 'kanban' : 'leads'} />
      ) : (
        <div className="overflow-x-auto">
          {viewMode === 'kanban' ? (
            <KanbanBoard
              columns={columns}
              onCardClick={handleCardClick}
              onPessoaClick={onPessoaClick}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              dragOverColumn={dragOverColumn}
              draggedLeadId={draggedLeadId}
            />
          ) : (
            <LeadListView
              leads={cardData}
              onLeadClick={handleCardClick}
              onPessoaClick={onPessoaClick}
            />
          )}
        </div>
      )}
    </div>
  );
};
