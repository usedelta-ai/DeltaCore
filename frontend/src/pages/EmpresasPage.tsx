import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
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
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid hsl(var(--card-border))', paddingBottom: '12px', marginBottom: '20px' }}>
              <h2>{editingId ? 'Editar' : 'Nova'} Empresa</h2>
              <button onClick={() => setIsFormOpen(false)} className="btn-ghost">✕</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Nome da Empresa</label>
                <input type="text" className="form-control" value={empresaName} onChange={e => setEmpresaName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Logo (Imagem)</label>
                <input type="file" accept="image/*" onChange={handleLogoUpload} />
                {empresaLogo && (
                  <img src={`data:image/png;base64,${empresaLogo}`} alt="Preview" style={{ marginTop: '10px', height: '60px', borderRadius: '8px' }} />
                )}
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
        title="Inativar Registro"
        description={`Tem certeza que deseja inativar "${deleteModal.name}"?`}
        onConfirm={handleDelete}
        onClose={() => setDeleteModal({ isOpen: false, id: 0, name: '' })}
        disabled={actionLoading}
      />
    </>
  );
};
