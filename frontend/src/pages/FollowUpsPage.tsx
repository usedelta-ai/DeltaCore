import React from 'react';
import { Building2, Users } from 'lucide-react';
import type { Agent, FollowUpSetting } from '../services/api';
import { ConfirmationModal } from '../components/Modal';
import { EditorWrapper } from '../components/ui/EditorWrapper';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FormInput } from '../components/ui/FormInput';
import { Modal } from '../components/ui/Modal';

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
      <div className="flex flex-col gap-6">
        {getGroupedFollowUps().map(empGroup => (
          <div key={empGroup.empresaId} className="bg-white border border-border-low-contrast rounded-xl p-6">
            <div className="border-b-2 border-border-low-contrast pb-2.5 mb-4 flex items-center gap-2.5">
              <Building2 size={18} className="text-primary" />
              <span className="font-bold text-on-surface">{empGroup.empresaName}</span>
            </div>
            {empGroup.agents.map((agGroup: any) => (
              <div key={agGroup.agentId} className="ml-3 mt-4">
                <h4 className="flex items-center gap-2 m-0 mb-3 text-body-md font-bold text-on-surface">
                  <Users size={16} />
                  <span>{agGroup.agentName}</span>
                </h4>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                  {agGroup.followUps.map((fl: FollowUpSetting) => (
                    <Card key={fl.id} className="flex flex-col">
                      <div className="flex justify-between items-center mb-3">
                        <Badge variant="info">Passo {fl.order}</Badge>
                        <Badge variant={fl.active ? 'success' : 'danger'}>
                          {fl.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-body-sm text-on-surface-variant">
                          <span className="font-bold text-on-surface">Tempo:</span> {fl.time} min
                        </p>
                        <blockquote className="border-l-3 border-primary pl-2.5 italic text-body-sm text-on-surface-variant m-0">
                          &ldquo;{fl.message}&rdquo;
                        </blockquote>
                      </div>
                      {hasWritePermission && (
                        <div className="flex gap-2 mt-4 pt-3 border-t border-border-low-contrast">
                          <Button size="sm" variant="secondary" onClick={() => openEditForm(fl)}>
                            Editar
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => confirmDelete(fl.id, `Follow-up ${fl.order}`)}>
                            Inativar
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {isFormOpen && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={`${editingId ? 'Editar' : 'Novo'} Passo de Follow-up`}
          maxWidth="90vw"
        >
          <form onSubmit={handleSave} className="flex flex-1 overflow-hidden" style={{ height: '75vh' }}>
            <div className="flex-1 flex flex-col min-w-0 border-r border-border-low-contrast">
              <div className="px-4 py-2 text-label-md font-label-md text-on-surface-variant bg-surface-subtle border-b border-border-low-contrast">
                Mensagem
              </div>
              <div className="flex-1 min-h-0">
                <EditorWrapper
                  key={`follow-msg-${editingId ?? 'new'}`}
                  itemKey={`follow-msg-${editingId ?? 'new'}`}
                  initialValue={followMessage}
                  onChange={setFollowMessage}
                  language="plaintext"
                />
              </div>
            </div>
            <div className="w-[280px] flex-shrink-0 flex flex-col bg-surface-subtle">
              <div className="flex-1 overflow-auto p-4">
                <div className="flex flex-col gap-3">
                  <FormInput
                    label="Ordem / Passo"
                    type="number"
                    value={followOrder}
                    onChange={e => setFollowOrder(Number(e.target.value))}
                    required
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-label-md font-label-md text-on-surface-variant">Agente</label>
                    <select
                      className="px-3.5 py-3 text-body-sm rounded-xl border border-border-low-contrast bg-white text-on-surface outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
                      value={followAgentId}
                      onChange={e => setFollowAgentId(Number(e.target.value))}
                    >
                      {getFilteredAgents().map(ag => (
                        <option key={ag.id} value={ag.id}>{ag.name}</option>
                      ))}
                    </select>
                  </div>
                  <FormInput
                    label="Tempo de Espera (minutos)"
                    type="number"
                    value={followTime}
                    onChange={e => setFollowTime(Number(e.target.value))}
                    required
                  />
                  <label className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-surface-subtle border border-border-low-contrast cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={followActive}
                      onChange={e => setFollowActive(e.target.checked)}
                      className="w-[18px] h-[18px] accent-primary rounded"
                    />
                    <span className="text-body-sm font-label-md text-on-surface">Ativo</span>
                  </label>
                </div>
              </div>
              <div className="border-t border-border-low-contrast p-4 flex flex-col gap-2">
                <Button type="submit" variant="primary" className="w-full justify-center" disabled={actionLoading}>
                  {actionLoading ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button type="button" variant="secondary" className="w-full justify-center" onClick={() => setIsFormOpen(false)} disabled={actionLoading}>
                  Cancelar
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {deleteModal.isOpen && (
        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          title="Inativar Follow-up"
          description={`Tem certeza que deseja inativar "${deleteModal.name}"?`}
          onConfirm={handleDelete}
          onClose={() => setDeleteModal({ isOpen: false, id: 0, name: '' })}
          disabled={actionLoading}
        />
      )}
    </>
  );
};
