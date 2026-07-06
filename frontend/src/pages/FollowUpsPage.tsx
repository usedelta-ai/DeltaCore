import React from 'react';
import { Pencil, Trash2, Building2, Users } from 'lucide-react';
import type { Agent, FollowUpSetting } from '../services/api';
import { ConfirmationModal } from '../components/Modal';

interface FollowUpsPageProps {
  getGroupedFollowUps: () => any[];
  getFilteredAgents: () => Agent[];
  hasWritePermission: boolean;
  openEditForm: (item: any) => void;
  confirmDelete: (id: number, name: string) => void;
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  editingId: number | null;
  followOrder: number;
  setFollowOrder: (v: number) => void;
  followAgentId: number;
  setFollowAgentId: (v: number) => void;
  followMessage: string;
  setFollowMessage: (v: string) => void;
  followTime: number;
  setFollowTime: (v: number) => void;
  followActive: boolean;
  setFollowActive: (v: boolean) => void;
  actionLoading: boolean;
  handleSave: (e: React.FormEvent) => void;
  deleteModal: { isOpen: boolean; id: number; name: string };
  handleDelete: () => void;
  setDeleteModal: (v: any) => void;
}

export const FollowUpsPage: React.FC<FollowUpsPageProps> = ({
  getGroupedFollowUps,
  getFilteredAgents,
  hasWritePermission,
  openEditForm,
  confirmDelete,
  isFormOpen,
  setIsFormOpen,
  editingId,
  followOrder,
  setFollowOrder,
  followAgentId,
  setFollowAgentId,
  followMessage,
  setFollowMessage,
  followTime,
  setFollowTime,
  followActive,
  setFollowActive,
  actionLoading,
  handleSave,
  deleteModal,
  handleDelete,
  setDeleteModal,
}) => {
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {getGroupedFollowUps().map(empGroup => (
          <div key={empGroup.empresaId} style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--card-border))', borderRadius: 'var(--radius)', padding: '24px' }}>
            <div style={{ borderBottom: '2px solid hsl(var(--card-border))', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={18} style={{ color: 'hsl(var(--primary))' }} />
              <span style={{ fontWeight: 700 }}>{empGroup.empresaName}</span>
            </div>
            {empGroup.agents.map((agGroup: any) => (
              <div key={agGroup.agentId} style={{ marginLeft: '12px', marginTop: '16px' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0' }}>
                  <Users size={16} />
                  <span>{agGroup.agentName}</span>
                </h4>
                <div className="dashboard-grid">
                  {agGroup.followUps.map((fl: FollowUpSetting) => (
                    <div key={fl.id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
                      <div className="card-header" style={{ marginBottom: '12px' }}>
                        <span className="badge badge-info">Passo {fl.order}</span>
                        <span className={`badge ${fl.active ? 'badge-success' : 'badge-danger'}`}>{fl.active ? 'Ativo' : 'Inativo'}</span>
                      </div>
                      <div className="card-body" style={{ flex: 1, padding: 0 }}>
                        <p><strong>Tempo:</strong> {fl.time} min</p>
                        <blockquote style={{ borderLeft: '3px solid hsl(var(--primary))', paddingLeft: '10px', fontStyle: 'italic' }}>
                          "{fl.message}"
                        </blockquote>
                      </div>
                      {hasWritePermission && (
                        <div className="card-footer" style={{ marginTop: '16px', paddingBottom: 0 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEditForm(fl)}>
                            <Pencil size={12} /> Editar
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => confirmDelete(fl.id, `Follow-up ${fl.order}`)}>
                            <Trash2 size={12} /> Inativar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid hsl(var(--card-border))', paddingBottom: '12px', marginBottom: '20px' }}>
              <h2>{editingId ? 'Editar' : 'Novo'} Passo de Follow-up</h2>
              <button onClick={() => setIsFormOpen(false)} className="btn-ghost">✕</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Ordem / Passo</label>
                <input type="number" className="form-control" value={followOrder} onChange={e => setFollowOrder(Number(e.target.value))} required />
              </div>
              <div className="form-group">
                <label>Agente</label>
                <select className="form-control" value={followAgentId} onChange={e => setFollowAgentId(Number(e.target.value))}>
                  {getFilteredAgents().map(ag => <option key={ag.id} value={ag.id}>{ag.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Mensagem</label>
                <textarea className="form-control" rows={3} value={followMessage} onChange={e => setFollowMessage(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Tempo de Espera (minutos)</label>
                <input type="number" className="form-control" value={followTime} onChange={e => setFollowTime(Number(e.target.value))} required />
              </div>
              <div className="form-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="checkbox" checked={followActive} onChange={e => setFollowActive(e.target.checked)} />
                <label style={{ margin: 0 }}>Ativo</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid hsl(var(--card-border))', paddingTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} disabled={actionLoading}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Inativar Follow-up"
        description={`Tem certeza que deseja inativar "${deleteModal.name}"?`}
        onConfirm={handleDelete}
        onClose={() => setDeleteModal({ isOpen: false, id: 0, name: '' })}
        disabled={actionLoading}
      />
    </>
  );
};
