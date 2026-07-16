import React from 'react';
import { TimelineDots } from './TimelineDots';
import type { TimelineDot } from './TimelineDots';
import type { Lead } from '../../services/api';

interface LeadCoreInfoPanelProps {
  lead: Lead;
  timelineDots?: TimelineDot[];
  formatCurrency: (val: number | null) => string;
  formatDate: (dateStr: string | null | undefined) => string;
  onViewAllTimeline?: () => void;
}

export const LeadCoreInfoPanel: React.FC<LeadCoreInfoPanelProps> = ({
  lead,
  timelineDots,
  formatCurrency,
  formatDate,
  onViewAllTimeline,
}) => {
  const getStatusLabel = (status: Lead['status']) => {
    switch (status) {
      case 'NOVO': return 'Novo Lead';
      case 'HUMANO': return 'Em Atendimento Humano';
      case 'FINALIZADO': return 'Finalizado';
      case 'CONCLUIDO': return 'Faturado';
      case 'CANCELADO': return 'Cancelado';
      default: return status;
    }
  };


  const props = lead.custom_properties || {};

  return (
    <section className="w-[320px] bg-white border-r border-border-low-contrast flex flex-col">
      <div className="p-6 overflow-y-auto flex-1">
        <h3 className="font-headline-md text-body-lg font-bold mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">info</span>
          Informações do Lead
        </h3>
        <div className="space-y-6">
          <div className="group">
            <label className="block text-label-md font-label-md text-on-surface-variant mb-1 ml-1">Nome</label>
            <input
              className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              type="text"
              value={lead.name || ''}
              readOnly
            />
          </div>
          <div className="group">
            <label className="block text-label-md font-label-md text-on-surface-variant mb-1 ml-1">Telefone</label>
            <input
              className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              type="text"
              value={lead.remote_jid_alt?.replace('@s.whatsapp.net', '') || ''}
              readOnly
            />
          </div>
          <div className="group">
            <label className="block text-label-md font-label-md text-on-surface-variant mb-1 ml-1">Email</label>
            <input
              className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              type="email"
              value={props.email || ''}
              readOnly
              placeholder="Não informado"
            />
          </div>
          <div className="group">
            <label className="block text-label-md font-label-md text-on-surface-variant mb-1 ml-1">Empresa</label>
            <input
              className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              type="text"
              value={props.company_name || props.empresa || ''}
              readOnly
              placeholder="Não informada"
            />
          </div>
          <div className="group">
            <label className="block text-label-md font-label-md text-on-surface-variant mb-1 ml-1">Valor Estimado</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">R$</span>
              <input
                className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl pl-8 pr-4 py-2.5 text-body-md font-bold text-primary focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                type="text"
                value={formatCurrency(lead.value)}
                readOnly
              />
            </div>
          </div>
          <div className="group">
            <label className="block text-label-md font-label-md text-on-surface-variant mb-1 ml-1">Status</label>
            <input
              className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              type="text"
              value={getStatusLabel(lead.status)}
              readOnly
            />
          </div>
          <div className="group">
            <label className="block text-label-md font-label-md text-on-surface-variant mb-1 ml-1">Agente Responsável</label>
            <input
              className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              type="text"
              value={lead.agent_name || 'Não atribuído'}
              readOnly
            />
          </div>
          <div className="group">
            <label className="block text-label-md font-label-md text-on-surface-variant mb-1 ml-1">Origem</label>
            <input
              className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl px-4 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              type="text"
              value={props.source || 'Não informada'}
              readOnly
            />
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border-low-contrast">
          <h4 className="font-label-md text-label-md text-on-surface-variant mb-4 uppercase tracking-wider">
            Tags de Classificação
          </h4>
          <div className="flex flex-wrap gap-2">
            <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1.5 rounded-lg text-label-md font-label-md">
              {getStatusLabel(lead.status)}
            </span>
            {lead.value && lead.value > 0 && (
              <span className="bg-secondary-fixed text-on-secondary-fixed px-3 py-1.5 rounded-lg text-label-md font-label-md">
                Valor: {formatCurrency(lead.value)}
              </span>
            )}
            <button className="bg-surface-container-high text-on-surface-variant px-3 py-1.5 rounded-lg text-label-md font-label-md hover:bg-primary-container hover:text-white transition-colors">
              + Adicionar Tag
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-1 text-body-sm text-on-surface-variant">
          <div><strong>Criado:</strong> {formatDate(lead.created_at)}</div>
          {lead.taken_over_at && <div><strong>Assumido:</strong> {formatDate(lead.taken_over_at)}</div>}
          {lead.updated_at && <div><strong>Atualizado:</strong> {formatDate(lead.updated_at)}</div>}
        </div>
      </div>

      {timelineDots && <TimelineDots dots={timelineDots} onViewAll={onViewAllTimeline} />}
    </section>
  );
};
