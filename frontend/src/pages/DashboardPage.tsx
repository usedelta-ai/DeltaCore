import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { FilterBar } from '../components/features/FilterBar';
import { KanbanBoard } from '../components/features/KanbanBoard';
import { LeadListView } from '../components/features/LeadListView';
import { SkeletonView } from '../components/ui/SkeletonView';
import { CreateLeadModal } from '../components/features/CreateLeadModal';
import type { LeadCardData } from '../components/features/LeadCard';
import type { Lead, Agent, Empresa } from '../services/api';
import { mapLeadToCardData } from '../utils/leadMapper';

const REFRESH_INTERVAL = 12;

interface DashboardPageProps {
  onLeadClick?: (leadId: number) => void;
  onNewLead?: () => void;
  createLead?: (data: Partial<Lead>) => Promise<any>;
  leads: Lead[];
  leadsTotal?: number;
  leadsSummary?: Record<string, { total: number; value: number }>;
  agents: Agent[];
  agentsMap: Map<number, Agent>;
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
  filterTransitioning?: boolean;
  searchTerm?: string;
  onSearchChange?: (search: string) => void;
  month?: string;
  onMonthChange?: (month: string) => void;
  hasWritePermission?: boolean;
  leadCreateTrigger?: number;
  isSuperAdmin?: boolean;
  currentUserEmpresaId?: number | null;
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

function getStatusFromColumnId(columnId: string): string {
  switch (columnId) {
    case 'ai-automated': return 'NOVO';
    case 'human-attended': return 'HUMANO';
    case 'finished': return 'FINALIZADO';
    case 'billed': return 'CONCLUIDO';
    default: return 'NOVO';
  }
}

function buildColumns(leads: LeadCardData[], summary?: Record<string, { total: number; value: number }>) {
  const cols = [
    { id: 'ai-automated', title: 'Lead em atendimento automatizado', dotColor: 'ai' as const, summaryKey: 'NOVO' },
    { id: 'human-attended', title: 'Em Atendimento', dotColor: 'human' as const, summaryKey: 'HUMANO' },
    { id: 'finished', title: 'Finalizados', dotColor: 'purple' as const, emptyIcon: 'archive', summaryKey: 'FINALIZADO' },
    { id: 'billed', title: 'Faturado', dotColor: 'success' as const, emptyIcon: 'add_shopping_cart', summaryKey: 'CONCLUIDO' },
  ] as const;

  return cols.map(col => {
    const colLeads = leads.filter(l => getColumnIdFromBadge(l.badge.label) === col.id);
    const summaryData = summary?.[col.summaryKey];
    return {
      ...col,
      leads: colLeads,
      totalCount: summaryData?.total ?? colLeads.length,
      totalValue: summaryData?.value ?? 0,
    };
  });
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onLeadClick,
  createLead,
  leads,
  leadsTotal: _leadsTotal,
  leadsSummary,
  agents,
  agentsMap,
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
  filterTransitioning = false,
  searchTerm = '',
  onSearchChange,
  month,
  onMonthChange,
  leadCreateTrigger = 0,
  isSuperAdmin = true,
  currentUserEmpresaId,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [hasLoadedForCurrentAgent, setHasLoadedForCurrentAgent] = useState(false);
  const [autoRefreshPaused, setAutoRefreshPaused] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (leadCreateTrigger > 0) {
      setShowCreateModal(true);
    }
  }, [leadCreateTrigger]);

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
    let result = leads.map(lead => mapLeadToCardData(lead, agentsMap));

    if (selectedStatus) {
      result = result.filter(card => card.badge.label === selectedStatus);
    }

    return result;
  }, [leads, agentsMap, selectedStatus]);

  const columns = useMemo(() => buildColumns(cardData, leadsSummary), [cardData, leadsSummary]);

  const companyOptions = useMemo(() =>
    isSuperAdmin ? empresas.map(e => ({ value: String(e.id), label: e.name })) : [],
    [empresas, isSuperAdmin]
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

    const newStatus = getStatusFromColumnId(columnId);
    const statusMap: Record<string, string> = {
      'NOVO': 'Novo Lead',
      'HUMANO': 'Em Atendimento',
      'FINALIZADO': 'Finalizado',
      'CONCLUIDO': 'Faturado',
      'CANCELADO': 'Cancelado'
    };
    const statusText = statusMap[newStatus] || newStatus;
    const motive = `Alterado para ${statusText} via Kanban`;

    updateLead(leadId, { status: newStatus as Lead['status'], taken_motive: motive });
  };

  const handleCardClick = (id: number) => {
    onLeadClick?.(id);
  };

  const handleSearchChange = (val: string) => {
    onSearchChange?.(val);
  };

  const handleOpenCreate = () => {
    setShowCreateModal(true);
  };

  const handleCreateLead = async (data: Partial<Lead>) => {
    if (!createLead) return;
    await createLead(data);
    setShowCreateModal(false);
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
          onSearchChange={handleSearchChange}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          companyOptions={companyOptions}
          agentOptions={agentOptions}
          countdown={countdown}
          isRefreshing={isRefreshing}
          onRefresh={triggerRefresh}
          month={month}
          onMonthChange={onMonthChange}
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
              onNewLead={handleOpenCreate}
              onPessoaClick={onPessoaClick}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              dragOverColumn={dragOverColumn}
              draggedLeadId={draggedLeadId}
              filterTransitioning={filterTransitioning}
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

      <CreateLeadModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateLead}
        agents={agents}
        selectedAgentFilter={Number(filterAgentId) || undefined}
        isSuperAdmin={isSuperAdmin}
        currentUserEmpresaId={currentUserEmpresaId}
      />
    </div>
  );
};
