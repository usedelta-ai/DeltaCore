import React, { useState, useMemo } from 'react';
import type { LeadCardData } from './LeadCard';
import { Pagination } from '../ui/Pagination';
import { LeadAvatar } from './LeadAvatar';

interface LeadListViewProps {
  leads: LeadCardData[];
  onLeadClick?: (id: number) => void;
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
    badgeBg: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    icon: 'smart_toy',
    label: 'Autendimento (IA)',
  },
  human: {
    badgeBg: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    icon: 'person',
    label: 'Humano',
  },
  finished: {
    badgeBg: 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
    icon: 'check_circle',
    label: 'Finalizado',
  },
  billed: {
    badgeBg: 'bg-green-500/10 text-green-500 border border-green-500/20',
    icon: 'receipt_long',
    label: 'Faturado',
  },
};

export const LeadListView: React.FC<LeadListViewProps> = ({
  leads,
  onLeadClick,
  onPessoaClick,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Reset page when list changes (like filtering)
  React.useEffect(() => {
    setCurrentPage(1);
  }, [leads]);

  const totalPages = Math.ceil(leads.length / itemsPerPage);
  const paginatedLeads = useMemo(() => {
    return leads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [leads, currentPage, itemsPerPage]);

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-surface border border-border-low-contrast rounded-2xl">
        <span className="material-symbols-outlined text-outline text-5xl mb-4">search_off</span>
        <p className="text-on-surface-variant font-medium">Nenhum lead encontrado com os filtros atuais.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface border border-border-low-contrast rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col">
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-270px)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-low-contrast bg-surface-container-low text-label-md text-on-surface-variant/80">
              <th className="py-4 px-6 font-bold">Lead</th>
              <th className="py-4 px-6 font-bold">Tipo Atendimento</th>
              <th className="py-4 px-6 font-bold">Situação</th>
              <th className="py-4 px-6 font-bold">Valor</th>
              <th className="py-4 px-6 font-bold">Última Atualização</th>
              <th className="py-4 px-6 text-right font-bold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-low-contrast/50">
            {paginatedLeads.map((lead) => {
              const type = typeConfig[lead.type];
              const badgeClass = badgeStyles[lead.badge.variant] || 'bg-surface-container-highest text-on-surface-variant';


              return (
                <tr
                  key={lead.id}
                  onClick={() => onLeadClick?.(lead.id)}
                  className="hover:bg-surface-container-lowest transition-colors cursor-pointer group"
                >
                  {/* Lead Info */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <LeadAvatar
                        leadId={lead.id}
                        avatarType={lead.avatarType}
                        avatarLabel={lead.avatarLabel}
                        className="w-9 h-9 text-xs shadow-sm"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-body-md text-on-surface group-hover:text-primary transition-colors">
                          {lead.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-body-sm text-on-surface-variant mt-0.5">
                          {lead.company && <span>{lead.company}</span>}
                          {lead.company && lead.phone && <span className="opacity-40">•</span>}
                          {lead.phone && <span className="font-mono text-[11px]">{lead.phone}</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Tipo Atendimento */}
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-md font-medium ${type.badgeBg}`}>
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {type.icon}
                      </span>
                      {type.label}
                    </span>
                  </td>

                  {/* Situação */}
                  <td className="py-4 px-6">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider ${badgeClass}`}>
                      {lead.badge.label}
                    </span>
                  </td>

                  {/* Valor */}
                  <td className="py-4 px-6 font-semibold text-body-md text-on-surface">
                    {lead.value !== undefined && lead.value !== null && lead.value > 0 ? (
                      <span className="text-status-success">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)}
                      </span>
                    ) : (
                      <span className="text-on-surface-variant/40">—</span>
                    )}
                  </td>

                  {/* Time ago */}
                  <td className="py-4 px-6 text-body-sm text-on-surface-variant/80">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant/50">schedule</span>
                      <span className="uppercase">{lead.timeAgo}</span>
                    </div>
                  </td>

                  {/* Ações */}
                  <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {lead.pessoa_id && (
                        <button
                          onClick={() => onPessoaClick?.(lead.pessoa_id!)}
                          title="Ver/Editar Cadastro de Pessoa"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface border border-border-low-contrast hover:bg-primary/5 hover:border-primary/30 hover:text-primary text-on-surface-variant transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">contact_page</span>
                        </button>
                      )}
                      <button
                        onClick={() => onLeadClick?.(lead.id)}
                        title="Ver Detalhes"
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface border border-border-low-contrast hover:bg-primary/5 hover:border-primary/30 hover:text-primary text-on-surface-variant transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={leads.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};
