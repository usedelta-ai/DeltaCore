import React from 'react';
import type { Agent, Empresa } from '../services/api';
import { ConfirmationModal } from '../components/Modal';
import { AgentEditModal } from '../components/features/AgentEditModal';
import { Accordion } from '../components/ui/Accordion';
import { Avatar } from '../components/ui/Avatar';

interface AgentsPageProps {
  getGroupedAgents: () => Array<{ empresaId: number; empresaName: string; empresaLogo: string | null; agents: Agent[] }>;
  hasWritePermission: boolean;
  isSuperAdmin: boolean;
  empresas: Empresa[];
  showEvolutionQrCode: (instanceName: string) => void;
  openEditForm: (item: Agent) => void;
  confirmDelete: (id: number, name: string) => void;
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  editingId: number | null;
  agentEditData: Partial<Agent> | null;
  handleAgentSave: (data: Record<string, unknown>) => Promise<void>;
  evolutionInstances: Array<Record<string, unknown>>;
  actionLoading: boolean;
  deleteModal: { isOpen: boolean; id: number; name: string };
  handleDelete: () => void;
  setDeleteModal: (v: { isOpen: boolean; id: number; name: string }) => void;
  qrModal: { isOpen: boolean; instanceName: string; qrCode: string | null; loading: boolean; error: string | null };
  setQrModal: (v: { isOpen: boolean; instanceName: string; qrCode: string | null; loading: boolean; error: string | null }) => void;
}

export const AgentsPage: React.FC<AgentsPageProps> = ({
  getGroupedAgents,
  hasWritePermission,
  isSuperAdmin,
  empresas,
  showEvolutionQrCode,
  openEditForm,
  confirmDelete,
  isFormOpen,
  setIsFormOpen,
  editingId,
  agentEditData,
  handleAgentSave,
  evolutionInstances,
  actionLoading,
  deleteModal,
  handleDelete,
  setDeleteModal,
  qrModal,
  setQrModal,
}) => {
  const groupedAgents = getGroupedAgents();

  const getEvolutionStatus = (ag: Agent) => {
    const status = ag.evolution_status;
    if (status === 'open' || status === 'connected') return { connected: true, label: status || 'conectado' };
    return { connected: false, label: status || 'desconectado' };
  };

  const agentIcon = (ag: Agent) => {
    if (ag.upsert_lead) return 'support_agent';
    if (ag.search) return 'search_insights';
    return 'smart_toy';
  };

  return (
    <>
      {/* Header Section */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">Gestão de Agentes</h1>
          <p className="text-body-md text-on-surface-variant">Configure e monitore seus assistentes virtuais inteligentes.</p>
        </div>
        {hasWritePermission && (
          <button
            onClick={() => {
              setIsFormOpen(true);
            }}
            className="bg-primary hover:bg-primary-container text-white px-6 py-2.5 rounded-lg flex items-center space-x-2 transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span className="font-semibold text-body-sm">Novo Agente</span>
          </button>
        )}
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {groupedAgents.map((empGroup: { empresaId: number; empresaName: string; empresaLogo: string | null; agents: Agent[] }, idx: number) => {
          const activeCount = empGroup.agents.filter((a: Agent) => a.status === 1).length;
          return (
            <Accordion
              key={empGroup.empresaId}
              defaultOpen={idx === 0}
              trigger={
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant overflow-hidden flex-shrink-0">
                    {empGroup.empresaLogo ? (
                      <Avatar
                        src={empGroup.empresaLogo}
                        name={empGroup.empresaName}
                        size="xl"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-primary text-2xl">apartment</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-headline-sm font-bold text-on-surface leading-tight">{empGroup.empresaName}</h2>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container text-on-secondary-container uppercase tracking-wider">
                        {empGroup.agents.length} Agente{empGroup.agents.length !== 1 ? 's' : ''}
                      </span>
                      {activeCount > 0 && (
                        <span className="text-[10px] text-status-success font-medium uppercase tracking-widest">
                          • {activeCount} ativo{activeCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              }
            >
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-2">
                {empGroup.agents.map((ag: Agent) => {
                  const isInactive = ag.status === 0;
                  const evoStatus = getEvolutionStatus(ag);

                  return (
                    <div
                      key={ag.id}
                      className={`bg-surface-container-low/50 border border-outline-variant/60 rounded-xl p-5 group hover:border-primary/40 transition-all ${
                        isInactive ? 'opacity-75' : ''
                      }`}
                    >
                      {/* Top Row: Icon + Name + Actions */}
                      <div className="flex justify-between items-start mb-5">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center relative ${
                              isInactive
                                ? 'bg-on-surface-variant/10'
                                : 'bg-primary/10'
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined text-xl ${
                                isInactive ? 'text-on-surface-variant' : 'text-primary'
                              }`}
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              {agentIcon(ag)}
                            </span>
                            <span
                              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                isInactive ? 'bg-outline' : evoStatus.connected ? 'bg-status-success' : 'bg-status-critical'
                              }`}
                            />
                          </div>
                          <div>
                            <h4 className="font-headline text-body-md font-bold">{ag.name}</h4>
                            <p className="text-[11px] text-on-surface-variant font-mono">ID: {ag.id}</p>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          {hasWritePermission && (
                            <>
                              <button
                                onClick={() => openEditForm(ag)}
                                className="p-1.5 hover:bg-white rounded-md text-on-surface-variant hover:text-primary transition-colors"
                                title="Editar"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              {!isInactive ? (
                                <button
                                  onClick={() => confirmDelete(ag.id, ag.name)}
                                  className="p-1.5 hover:bg-error-container/20 rounded-md text-error transition-colors"
                                  title="Inativar"
                                >
                                  <span className="material-symbols-outlined text-lg">block</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => openEditForm(ag)}
                                  className="p-1.5 hover:bg-primary-container/20 rounded-md text-primary transition-colors"
                                  title="Reativar"
                                >
                                  <span className="material-symbols-outlined text-lg">play_arrow</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white/80 p-3 rounded-lg border border-outline-variant/30">
                          <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">WhatsApp</p>
                          <p className="text-body-xs font-medium truncate">{ag.phone_number || '—'}</p>
                        </div>
                        <div className="bg-white/80 p-3 rounded-lg border border-outline-variant/30">
                          <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">
                            Instância
                            {ag.instance_name && !isInactive && (
                              <span
                                className={`ml-1.5 inline-block w-1.5 h-1.5 rounded-full ${
                                  evoStatus.connected ? 'bg-status-success' : 'bg-status-critical'
                                }`}
                              />
                            )}
                          </p>
                          <p className="text-body-xs font-medium text-primary truncate">{ag.instance_name || '—'}</p>
                        </div>
                      </div>

                      {/* Actions / Status Messages */}
                      {isInactive ? (
                        <div className="p-3 bg-white/40 rounded-lg border border-dashed border-outline-variant text-[12px] italic text-on-surface-variant">
                          Agente inativo. Clique em <strong>Reativar</strong> para reconfigurar.
                        </div>
                      ) : ag.instance_name && !evoStatus.connected && hasWritePermission ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => showEvolutionQrCode(ag.instance_name)}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-status-success text-white hover:opacity-90 transition-all shadow-md shadow-status-success/20"
                          >
                            <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                            Conectar WhatsApp
                          </button>
                        </div>
                      ) : ag.instance_name && evoStatus.connected ? (
                        <div className="flex items-center gap-1.5 text-[12px] text-status-success font-medium">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Conectado via WhatsApp
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Accordion>
          );
        })}
      </div>

      {/* Edit Modal */}
      <AgentEditModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleAgentSave}
        initialData={agentEditData}
        empresas={empresas}
        evolutionInstances={evolutionInstances as any}
        isSuperAdmin={isSuperAdmin}
        editingId={editingId}
      />

      {/* QR Code Modal */}
      {qrModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-[400px] bg-white border border-border-low-contrast rounded-2xl shadow-2xl p-6 text-center">
            <div className="flex justify-between items-center pb-3 mb-5 border-b border-border-low-contrast">
              <h2 className="text-headline-md font-headline-md font-bold m-0">Conectar WhatsApp</h2>
              <button
                onClick={() => setQrModal({ ...qrModal, isOpen: false })}
                className="w-8 h-8 flex items-center justify-center rounded-lg border-none cursor-pointer text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            {qrModal.loading ? (
              <div className="py-10 text-on-surface-variant">Gerando QR Code...</div>
            ) : qrModal.error ? (
              <div className="text-status-critical py-5">{qrModal.error}</div>
            ) : qrModal.qrCode ? (
              <div>
                <img src={qrModal.qrCode} alt="WhatsApp QR Code" className="max-w-full rounded-lg mx-auto" />
                <p className="mt-4 text-body-sm text-on-surface-variant">
                  Escaneie este QR Code no seu WhatsApp para ativar a instância{' '}
                  <strong className="text-on-surface">{qrModal.instanceName}</strong>.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          title="Inativar Agente"
          description={`Tem certeza que deseja inativar "${deleteModal.name}"?`}
          onConfirm={handleDelete}
          onClose={() => setDeleteModal({ isOpen: false, id: 0, name: '' })}
          disabled={actionLoading}
        />
      )}
    </>
  );
};
