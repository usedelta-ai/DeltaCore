import React, { useState } from 'react';
import { LeadCoreInfoPanel } from '../components/features/LeadCoreInfoPanel';
import { TeamChatPanel } from '../components/features/TeamChatPanel';
import type { TimelineDot } from '../components/features/TimelineDots';
import { useLeadDetail } from '../hooks/useLeadDetail';
import { api } from '../services/api';
import type { ChatMessage, Lead, Agent } from '../services/api';
import { SideNavBar } from '../components/layout/SideNavBar';
import { mediaCache } from '../components/features/MediaMessageRenderer';
import { ActivityModal } from '../components/features/ActivityModal';

interface ImmersiveLeadViewProps {
  leadId?: number;
  onBack?: () => void;
  systemLogo?: string | null;
  userName?: string;
  isSuperAdmin?: boolean;
  systemName?: string;
  onTabChange?: (tab: any) => void;
  onLogout?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  hasWritePermission?: boolean;
  agents?: Agent[];
  onPessoaClick?: (pessoaId: number) => void;
}

export const ImmersiveLeadView: React.FC<ImmersiveLeadViewProps> = ({
  leadId,
  onBack,
  systemLogo,
  userName,
  isSuperAdmin,
  systemName,
  onTabChange,
  onLogout,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
  hasWritePermission = true,
  agents = [],
  onPessoaClick,
}) => {
  const { lead, chatHistory, timelineEvents, loading, error, refetch } = useLeadDetail(leadId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showFinalizationModal, setShowFinalizationModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [finalizationStep, setFinalizationStep] = useState<'ask_sale' | 'enter_value'>('ask_sale');
  const [finalizationValue, setFinalizationValue] = useState('');

  const handleUpdateLead = async (updateData: Partial<Lead>) => {
    if (!leadId) return;
    await api.updateLead(leadId, updateData);
    refetch();
  };
  const [finalizationLoading, setFinalizationLoading] = useState(false);

  React.useEffect(() => {
    setMessages(chatHistory);
  }, [chatHistory]);

  const handleSendMessage = async (text: string, options?: { messageType?: string; mediaBase64?: string; fileName?: string }) => {
    if (!leadId || !lead) return;
    let finalPayloadText = text;
    if (!options?.mediaBase64 && text.trim()) {
      const senderLabel = userName || 'Atendente';
      finalPayloadText = `*${senderLabel}*\n${text}`;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage & { mediaBase64?: string } = {
      id: tempId,
      content: options?.mediaBase64 ? (options.fileName || '') : finalPayloadText,
      role: 'attendant',
      source: 'platform',
      messageType: options?.messageType || 'text',
      createdAt: new Date().toISOString(),
      mediaBase64: options?.mediaBase64,
    };

    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = await api.sendLeadMessage(leadId, finalPayloadText, options);
      if (res?.message && options?.mediaBase64) {
        const wppId = res.message.messageId || res.message.message_id;
        const dbId = res.message.id;
        let src = options.mediaBase64;
        if (!src.startsWith('data:')) {
          const normType = (options.messageType || 'text').replace(/Message$/, '');
          if (normType === 'image') src = `data:image/png;base64,${src}`;
          else if (normType === 'audio') src = `data:audio/ogg;base64,${src}`;
          else if (normType === 'video') src = `data:video/mp4;base64,${src}`;
          else if (normType === 'sticker') src = `data:image/webp;base64,${src}`;
          else src = `data:application/octet-stream;base64,${src}`;
        }
        if (wppId) mediaCache.set(wppId, src);
        if (dbId) mediaCache.set(dbId, src);
      }
      if (lead.status === 'NOVO') {
        await api.updateLead(leadId, { status: 'HUMANO' });
      }
      refetch();
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleQuickAssume = async () => {
    if (!leadId) return;
    try {
      await api.updateLead(leadId, { 
        status: 'HUMANO', 
        taken_motive: `Assumido por ${userName || 'Atendente'}`
      });
      refetch();
    } catch (err: any) {
      alert('Erro ao assumir atendimento: ' + err.message);
    }
  };

  const handleQuickCancel = async () => {
    if (!leadId) return;
    if (!confirm('Tem certeza que deseja cancelar este atendimento?')) return;
    try {
      await api.updateLead(leadId, { 
        status: 'CANCELADO',
        taken_motive: `Cancelado por ${userName || 'Atendente'}`
      });
      refetch();
    } catch (err: any) {
      alert('Erro ao cancelar atendimento: ' + err.message);
    }
  };

  const handleFinalize = async (hadSale: boolean, value?: number) => {
    if (!leadId) return;
    setFinalizationLoading(true);
    try {
      const updateData: Partial<Lead> = { 
        status: hadSale ? 'CONCLUIDO' : 'FINALIZADO',
        taken_motive: `${hadSale ? 'Concluído com venda' : 'Finalizado sem venda'} por ${userName || 'Atendente'}`
      };
      if (hadSale && value !== undefined) {
        updateData.value = value;
      }
      await api.updateLead(leadId, updateData);
      setShowFinalizationModal(false);
      refetch();
    } catch (err: any) {
      alert('Erro ao finalizar atendimento: ' + err.message);
    } finally {
      setFinalizationLoading(false);
    }
  };

  const defaultTimelineDots: TimelineDot[] = timelineEvents.length > 0
    ? timelineEvents.map((event) => ({
        type: event.type === 'ai' ? 'ai' : event.type === 'human' ? 'human' : 'add',
        icon: event.icon,
        src: event.avatarSrc,
        label: event.label,
      }))
    : [
        { type: 'add', label: 'Novo evento' },
      ];

  if (loading) {
    return (
      <div className="bg-background text-on-surface overflow-hidden h-screen flex items-center justify-center">
        <div className="text-center text-on-surface-variant">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Carregando lead...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background text-on-surface overflow-hidden h-screen flex items-center justify-center">
        <div className="text-center text-status-critical p-8">
          <span className="material-symbols-outlined text-5xl block mb-4">error</span>
          <p>{error}</p>
          <button className="mt-4 px-6 py-2 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-opacity cursor-pointer" onClick={refetch}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="bg-background text-on-surface overflow-hidden h-screen flex items-center justify-center">
        <div className="text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl block mb-4">person_search</span>
          <p>Lead não encontrado</p>
          <button className="mt-4 px-6 py-2 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-opacity cursor-pointer" onClick={onBack}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (val: number | null) => {
    if (val === null || val === undefined) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-background text-on-surface overflow-hidden h-screen flex">
      {/* Side Menu matching the rest of the system */}
      <SideNavBar
        activeTab="leads"
        onTabChange={(tab) => {
          if (onTabChange) {
            onTabChange(tab);
          }
        }}
        systemName={systemName}
        systemLogo={systemLogo}
        isSuperAdmin={isSuperAdmin}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={onToggleSidebarCollapse}
        onLogout={onLogout}
      />

      {/* Main Content with dynamic margin for sidebar collapse */}
      <main className={`flex-1 flex flex-col h-screen bg-surface-subtle ${isSidebarCollapsed ? 'ml-20' : 'ml-64'} transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`}>
        {/* Immersive Header */}
        <header className="h-20 border-b border-border-low-contrast bg-white flex justify-between items-center px-8 z-40">
          <div className="flex items-center gap-6">
            <button
              className="p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant cursor-pointer"
              onClick={onBack}
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-primary rounded-full" />
              <div>
                <h2 className="text-headline-md font-headline-md leading-none">{lead.name || 'Sem nome'}</h2>
                <p className="text-label-md font-label-md text-on-surface-variant mt-1">
                  #{lead.id} • {lead.remote_jid_alt?.replace('@s.whatsapp.net', '') || 'Sem telefone'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`hidden md:flex border rounded-full px-4 py-1.5 items-center gap-2 ${lead.status === 'NOVO' ? 'bg-primary-fixed/20 border-primary/20' : lead.status === 'HUMANO' ? 'bg-tertiary-fixed/20 border-tertiary-fixed/20' : 'bg-status-success/10 border-status-success/20'}`}>
              <span className={`w-2 h-2 rounded-full ${lead.status === 'NOVO' ? 'bg-ai-accent' : lead.status === 'HUMANO' ? 'bg-secondary' : 'bg-status-success'}`} />
              <span className="text-label-md font-label-md">
                {lead.status === 'NOVO' ? 'Novo Lead' :
                 lead.status === 'HUMANO' ? 'Em Atendimento' :
                 lead.status === 'FINALIZADO' ? 'Finalizado' :
                 lead.status === 'CONCLUIDO' ? 'Faturado' : 'Cancelado'}
              </span>
            </div>
            <button className="px-6 py-2 border border-border-low-contrast rounded-xl font-label-md text-label-md hover:bg-surface-container transition-colors cursor-pointer" onClick={onBack}>
              Fechar
            </button>
            {lead.status === 'NOVO' && (
              <button
                onClick={handleQuickAssume}
                className="px-6 py-2 bg-primary text-on-primary rounded-xl font-label-md text-label-md hover:opacity-90 transition-opacity shadow-md shadow-primary/20 cursor-pointer"
              >
                🤝 Assumir Atendimento
              </button>
            )}
            {lead.status === 'HUMANO' && (
              <button
                onClick={() => {
                  setFinalizationStep('ask_sale');
                  setFinalizationValue('');
                  setShowFinalizationModal(true);
                }}
                className="px-6 py-2 bg-primary text-on-primary rounded-xl font-label-md text-label-md hover:opacity-90 transition-opacity shadow-md shadow-primary/20 cursor-pointer"
              >
                ✅ Finalizar Atendimento
              </button>
            )}
            {lead.status !== 'CANCELADO' && lead.status !== 'FINALIZADO' && lead.status !== 'CONCLUIDO' && hasWritePermission && (
              <button
                onClick={handleQuickCancel}
                className="px-6 py-2 border border-status-critical text-status-critical hover:bg-status-critical/10 rounded-xl font-label-md text-label-md transition-colors cursor-pointer"
              >
                🚫 Cancelar Atendimento
              </button>
            )}
          </div>
        </header>

        {/* Split Layout */}
        <div className="flex-1 flex overflow-hidden">
          <LeadCoreInfoPanel
            lead={lead}
            timelineDots={defaultTimelineDots}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            onViewAllTimeline={() => setShowActivityModal(true)}
            agents={agents}
            onUpdateLead={handleUpdateLead}
            hasWritePermission={hasWritePermission}
            onPessoaClick={onPessoaClick}
          />
          <TeamChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            leadName={lead.name || 'Lead'}
            leadPhone={lead.remote_jid_alt}
            userName={userName}
            agentName={lead.agent_name}
            systemLogo={systemLogo}
            leadStatus={lead.status}
            finalizedAt={lead.updated_at || undefined}
          />
        </div>
      </main>

      {/* Modern Finalization Modal */}
      {showFinalizationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl border border-border-low-contrast">
            {finalizationStep === 'ask_sale' ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-3xl mx-auto mb-4">💰</div>
                <h3 className="text-headline-md font-bold mb-2">Finalizar Atendimento</h3>
                <p className="text-body-md text-on-surface-variant mb-6">Houve venda neste atendimento?</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
                  <button
                    onClick={() => setFinalizationStep('enter_value')}
                    className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Sim, houve venda
                  </button>
                  <button
                    onClick={() => handleFinalize(false)}
                    className="flex-1 px-6 py-3 border border-border-low-contrast rounded-xl font-bold hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    Não houve venda
                  </button>
                </div>
                <button
                  onClick={() => setShowFinalizationModal(false)}
                  className="text-label-md text-on-surface-variant hover:text-primary transition-colors font-bold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-status-success/10 text-status-success rounded-full flex items-center justify-center text-3xl mx-auto mb-4">💰</div>
                <h3 className="text-headline-md font-bold mb-2">Valor da Venda</h3>
                <p className="text-body-md text-on-surface-variant mb-4">Qual o valor gerado neste atendimento?</p>
                <input
                  type="number"
                  placeholder="0,00"
                  value={finalizationValue}
                  onChange={e => setFinalizationValue(e.target.value)}
                  className="w-full border border-border-low-contrast rounded-xl px-4 py-3 text-body-md mb-6 text-center focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-bold text-lg"
                  autoFocus
                />
                <div className="flex gap-3 justify-center">
                  <button
                    disabled={finalizationLoading}
                    onClick={() => handleFinalize(true, Number(finalizationValue))}
                    className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                  >
                    {finalizationLoading ? 'Salvando...' : 'Confirmar'}
                  </button>
                  <button
                    onClick={() => setFinalizationStep('ask_sale')}
                    className="flex-1 px-6 py-3 border border-border-low-contrast rounded-xl font-bold hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern Activity/History Modal */}
      {showActivityModal && (
        <ActivityModal
          events={timelineEvents}
          leadName={lead.name || undefined}
          onClose={() => setShowActivityModal(false)}
        />
      )}
    </div>
  );
};
