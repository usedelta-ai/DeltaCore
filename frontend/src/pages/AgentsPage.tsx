import React from 'react';
import { Pencil, Trash2, Building2 } from 'lucide-react';
import type { Agent, Empresa } from '../services/api';
import { ConfirmationModal } from '../components/Modal';
import { AgentEditModal } from '../components/features/AgentEditModal';

interface AgentsPageProps {
  getGroupedAgents: () => any[];
  hasWritePermission: boolean;
  isSuperAdmin: boolean;
  empresas: Empresa[];
  showEvolutionQrCode: (instanceName: string) => void;
  openEditForm: (item: any) => void;
  confirmDelete: (id: number, name: string) => void;
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  editingId: number | null;
  agentEditData: any;
  handleAgentSave: (data: any) => Promise<void>;
  evolutionInstances: any[];
  actionLoading: boolean;
  deleteModal: { isOpen: boolean; id: number; name: string };
  handleDelete: () => void;
  setDeleteModal: (v: any) => void;
  qrModal: { isOpen: boolean; instanceName: string; qrCode: string | null; loading: boolean; error: string | null };
  setQrModal: (v: any) => void;
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

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
        {groupedAgents.map(empGroup => (
          <div key={empGroup.empresaId} style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--card-border))', borderRadius: 'var(--radius)', padding: '24px' }}>
            <div className="tree-empresa-header" style={{ borderBottom: '2px solid hsl(var(--card-border))', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {empGroup.empresaLogo ? (
                <img src={`data:image/png;base64,${empGroup.empresaLogo}`} alt={empGroup.empresaName} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <Building2 size={18} style={{ color: 'hsl(var(--primary))' }} />
              )}
              <span style={{ fontWeight: 700 }}>{empGroup.empresaName}</span>
            </div>
            <div className="dashboard-grid">
              {empGroup.agents.map((ag: Agent) => {
                const isInactive = ag.status === 0;
                return (
                  <div key={ag.id} className="card" style={isInactive ? { opacity: 0.6 } : {}}>
                    <div className="card-header">
                      <span className={`badge ${isInactive ? 'badge-danger' : ag.status === 1 ? 'badge-success' : 'badge-warning'}`}>
                        {isInactive ? 'Inativo' : ag.status === 1 ? 'Ativo' : 'Pendente'}
                      </span>
                    </div>
                    <div className="card-body">
                      <h3 className="card-title">{ag.name}</h3>
                      <p><strong>Telefone:</strong> {ag.phone_number}</p>
                      <p>
                        <strong>Instância:</strong> {ag.instance_name}{' '}
                        {ag.instance_name && !isInactive && (
                          <span className={`badge ${ag.evolution_status === 'open' || ag.evolution_status === 'connected' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '9px', marginLeft: '6px' }}>
                            {ag.evolution_status || 'desconectado'}
                          </span>
                        )}
                      </p>
                      <p style={{ maxHeight: '80px', overflow: 'hidden' }}>
                        <strong>Prompt:</strong> {ag.prompt}
                      </p>
                    </div>
                    <div className="card-footer">
                      {!isInactive && ag.instance_name && ag.evolution_status !== 'open' && ag.evolution_status !== 'connected' && hasWritePermission && (
                        <button className="btn btn-primary btn-sm" onClick={() => showEvolutionQrCode(ag.instance_name)}>
                          ⚡ QR Code
                        </button>
                      )}
                      {hasWritePermission && (
                        <>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEditForm(ag)}>
                            <Pencil size={12} /> Editar
                          </button>
                          {!isInactive && (
                            <button className="btn btn-danger btn-sm" onClick={() => confirmDelete(ag.id, ag.name)}>
                              <Trash2 size={12} /> Inativar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <AgentEditModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleAgentSave}
        initialData={agentEditData}
        empresas={empresas}
        evolutionInstances={evolutionInstances}
        isSuperAdmin={isSuperAdmin}
        editingId={editingId}
      />

      {qrModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid hsl(var(--card-border))', paddingBottom: '12px', marginBottom: '20px' }}>
              <h2>Conectar WhatsApp</h2>
              <button onClick={() => setQrModal((prev: any) => ({ ...prev, isOpen: false }))} className="btn-ghost">✕</button>
            </div>
            {qrModal.loading ? (
              <div style={{ padding: '40px' }}>Gerando QR Code...</div>
            ) : qrModal.error ? (
              <div style={{ color: 'red', padding: '20px' }}>{qrModal.error}</div>
            ) : qrModal.qrCode ? (
              <div>
                <img src={qrModal.qrCode} alt="WhatsApp QR Code" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                <p style={{ marginTop: '16px', fontSize: '13px' }}>Escaneie este QR Code no seu WhatsApp para ativar a instância <strong>{qrModal.instanceName}</strong>.</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Inativar Agente"
        description={`Tem certeza que deseja inativar "${deleteModal.name}"?`}
        onConfirm={handleDelete}
        onClose={() => setDeleteModal({ isOpen: false, id: 0, name: '' })}
        disabled={actionLoading}
      />
    </>
  );
};
