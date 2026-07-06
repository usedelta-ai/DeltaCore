import React from 'react';
import { Pencil, Trash2, Building2, Users } from 'lucide-react';
import type { Agent, FollowUpSetting } from '../services/api';
import { ConfirmationModal } from '../components/Modal';
import { EditorWrapper } from '../components/ui/EditorWrapper';

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
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          backgroundColor: 'rgba(9, 10, 12, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            width: '100%', height: '95vh',
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--card-border))',
            borderRadius: '20px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid hsl(var(--card-border))', flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                {editingId ? 'Editar' : 'Novo'} Passo de Follow-up
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="btn-ghost" style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '18px',
                color: 'hsl(var(--muted-foreground))', background: 'transparent',
              }}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Left Panel - Editor */}
              <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: '1px solid hsl(var(--card-border))' }}>
                <div style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--background))', borderBottom: '1px solid hsl(var(--card-border))' }}>
                  Mensagem
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <EditorWrapper
                    key={`follow-msg-${editingId ?? 'new'}`}
                    itemKey={`follow-msg-${editingId ?? 'new'}`}
                    initialValue={followMessage}
                    onChange={setFollowMessage}
                    language="plaintext"
                  />
                </div>
              </div>
              {/* Right Panel - Fields */}
              <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>
                <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Ordem / Passo</label>
                      <input type="number" className="form-control" value={followOrder} onChange={e => setFollowOrder(Number(e.target.value))} required />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Agente</label>
                      <select className="form-control" value={followAgentId} onChange={e => setFollowAgentId(Number(e.target.value))}>
                        {getFilteredAgents().map(ag => <option key={ag.id} value={ag.id}>{ag.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Tempo de Espera (minutos)</label>
                      <input type="number" className="form-control" value={followTime} onChange={e => setFollowTime(Number(e.target.value))} required />
                    </div>
                    <div className="form-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="checkbox" checked={followActive} onChange={e => setFollowActive(e.target.checked)} />
                      <label style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>Ativo</label>
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid hsl(var(--card-border))', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={actionLoading}>
                    {actionLoading ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button type="button" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setIsFormOpen(false)} disabled={actionLoading}>
                    Cancelar
                  </button>
                </div>
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
