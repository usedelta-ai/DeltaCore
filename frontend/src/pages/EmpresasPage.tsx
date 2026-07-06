import React from 'react';
import { Pencil, Trash2, Image } from 'lucide-react';
import type { Empresa } from '../services/api';
import { getBoardUrl } from '../services/api';
import { ConfirmationModal } from '../components/Modal';

interface EmpresasPageProps {
  empresas: Empresa[];
  showInactive: boolean;
  hasWritePermission: boolean;
  createEmpresa: (name: string, logo: string | null) => Promise<any>;
  updateEmpresa: (id: number, name: string, logo?: string | null) => Promise<any>;
  deleteEmpresa: (id: number) => Promise<any>;
  openCreateForm: () => void;
  openEditForm: (item: any) => void;
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  editingId: number | null;
  empresaName: string;
  setEmpresaName: (val: string) => void;
  empresaLogo: string | null;
  setEmpresaLogo: (val: string | null) => void;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  actionLoading: boolean;
  handleSave: (e: React.FormEvent) => void;
  confirmDelete: (id: number, name: string) => void;
  deleteModal: { isOpen: boolean; id: number; name: string };
  handleDelete: () => void;
  setDeleteModal: (val: any) => void;
}

export const EmpresasPage: React.FC<EmpresasPageProps> = ({
  empresas,
  showInactive,
  hasWritePermission,
  openEditForm,
  isFormOpen,
  setIsFormOpen,
  editingId,
  empresaName,
  setEmpresaName,
  empresaLogo,
  handleLogoUpload,
  actionLoading,
  handleSave,
  confirmDelete,
  deleteModal,
  handleDelete,
  setDeleteModal,
}) => {
  const visibleEmpresas = showInactive
    ? empresas.filter(e => !e.active)
    : empresas.filter(e => e.active);

  return (
    <>
      <div className="dashboard-grid">
        {visibleEmpresas.map(emp => (
          <div key={emp.id} className="card" style={!emp.active ? { opacity: 0.6 } : {}}>
            <div className="card-header">
              {emp.logo ? (
                <img src={`data:image/png;base64,${emp.logo}`} alt={emp.name} className="company-logo" />
              ) : (
                <div className="company-logo-placeholder">{emp.name.charAt(0).toUpperCase()}</div>
              )}
              <span className={`badge ${emp.active ? 'badge-success' : 'badge-danger'}`}>
                {emp.active ? 'Ativa' : 'Inativa'}
              </span>
            </div>
            <div className="card-body">
              <h3 className="card-title">{emp.name}</h3>
              <span style={{ fontSize: '12px', marginTop: '8px' }}>
                Criado em: {new Date(emp.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="card-footer">
              {emp.active && (
                <>
                  <a href={getBoardUrl(emp.id, emp.name)} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                    🔗 Board
                  </a>
                  {hasWritePermission && (
                    <>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditForm(emp)}>
                        <Pencil size={12} /> Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => confirmDelete(emp.id, emp.name)}>
                        <Trash2 size={12} /> Inativar
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
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
            width: '100%', maxWidth: '560px',
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--card-border))',
            borderRadius: '20px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid hsl(var(--card-border))' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{editingId ? 'Editar' : 'Nova'} Empresa</h2>
              <button onClick={() => setIsFormOpen(false)} className="btn-ghost" style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '18px',
                color: 'hsl(var(--muted-foreground))', background: 'transparent',
              }}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Nome da Empresa</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Minha Empresa Ltda"
                  value={empresaName}
                  onChange={e => setEmpresaName(e.target.value)}
                  required
                  style={{ padding: '12px 14px', fontSize: '14px', borderRadius: '10px' }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Logo</label>
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', cursor: 'pointer',
                  border: '2px dashed hsl(var(--card-border))',
                  borderRadius: '12px', padding: '24px',
                  background: 'hsl(var(--background))',
                  transition: 'all 0.2s',
                }}
                  onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--primary))'; }}
                  onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = ''; }}
                >
                  {empresaLogo ? (
                    <img src={`data:image/png;base64,${empresaLogo}`} alt="Preview" style={{ height: '80px', borderRadius: '12px', objectFit: 'contain' }} />
                  ) : (
                    <>
                      <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'hsl(var(--card))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))' }}>
                        <Image size={24} />
                      </div>
                      <span style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>Clique para selecionar uma imagem</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid hsl(var(--card-border))', paddingTop: '20px', marginTop: '4px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} disabled={actionLoading}
                  style={{ padding: '10px 20px', borderRadius: '10px' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}
                  style={{ padding: '10px 20px', borderRadius: '10px' }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Inativar Registro"
        description={`Tem certeza que deseja inativar "${deleteModal.name}"?`}
        onConfirm={handleDelete}
        onClose={() => setDeleteModal({ isOpen: false, id: 0, name: '' })}
        disabled={actionLoading}
      />
    </>
  );
};
