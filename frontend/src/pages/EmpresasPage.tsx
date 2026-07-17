import React, { useState } from 'react';
import { Pencil, Trash2, Image, Copy, Check } from 'lucide-react';
import type { Empresa } from '../services/api';
import { getBoardUrl } from '../services/api';
import { ConfirmationModal } from '../components/Modal';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FormInput } from '../components/ui/FormInput';
import { Pagination } from '../components/ui/Pagination';

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
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const handleCopyLink = (id: number) => {
    const base64Id = btoa(String(id));
    const url = `${window.location.origin}/${base64Id}/login`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const visibleEmpresas = showInactive
    ? empresas.filter(e => !e.active)
    : empresas.filter(e => e.active);

  // Reset page when toggle active changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [showInactive, empresas]);

  const totalPages = Math.ceil(visibleEmpresas.length / itemsPerPage);
  const paginatedEmpresas = visibleEmpresas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <div className="flex flex-col rounded-2xl border border-border-low-contrast bg-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 p-6 max-h-[calc(100vh-230px)] overflow-y-auto">
          {paginatedEmpresas.map(emp => (
          <div
            key={emp.id}
            className="flex flex-col justify-between rounded-2xl border border-border-low-contrast bg-white bg-gradient-to-br from-white via-white to-surface-subtle p-6 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-primary/40 relative overflow-hidden opacity-100"
            style={{ opacity: emp.active ? 1 : 0.7 }}
          >
            <div>
              <div className="flex justify-between items-start mb-5">
                {emp.logo ? (
                  <img
                    src={`data:image/png;base64,${emp.logo}`}
                    alt={emp.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-border-low-contrast shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold border border-primary/15">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <Badge variant={emp.active ? 'success' : 'danger'}>
                  {emp.active ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>

              <h3 className="text-headline-md font-headline-md font-bold text-on-surface m-0 mb-1.5 tracking-tight leading-tight">
                {emp.name}
              </h3>

              <div className="text-label-md text-on-surface-variant flex items-center gap-1 mb-6">
                <span>Registrada em:</span>
                <strong className="text-on-surface font-medium">
                  {new Date(emp.created_at).toLocaleDateString()}
                </strong>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 border-t border-border-low-contrast/50 pt-4 mt-auto">
              {emp.active && (
                <>
                  <a
                    href={getBoardUrl(emp.id, emp.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-label-md bg-primary text-on-primary hover:opacity-90 transition-opacity shadow-md shadow-primary/20 no-underline cursor-pointer"
                  >
                    🔗 Board
                  </a>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopyLink(emp.id)}
                  >
                    {copiedId === emp.id ? (
                      <><Check size={13} className="text-status-success" /> Copiado!</>
                    ) : (
                      <><Copy size={13} /> Copiar Login</>
                    )}
                  </Button>
                  {hasWritePermission && (
                    <div className="flex gap-2 ml-auto">
                      <button
                        onClick={() => openEditForm(emp)}
                        className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-all cursor-pointer border-none"
                        title="Editar Empresa"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => confirmDelete(emp.id, emp.name)}
                        className="p-2 rounded-lg text-status-critical hover:bg-status-critical/10 transition-all cursor-pointer border-none"
                        title="Inativar Empresa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={visibleEmpresas.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {isFormOpen && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={`${editingId ? 'Editar' : 'Nova'} Empresa`}
        >
          <form onSubmit={handleSave} className="flex flex-col gap-5 p-6">
            <FormInput
              label="Nome da Empresa"
              placeholder="Ex: Minha Empresa Ltda"
              value={empresaName}
              onChange={e => setEmpresaName(e.target.value)}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-label-md text-on-surface-variant">Logo</label>
              <label className="flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-border-low-contrast rounded-xl p-6 bg-surface-subtle transition-all duration-200 hover:border-primary">
                {empresaLogo ? (
                  <img
                    src={`data:image/png;base64,${empresaLogo}`}
                    alt="Preview"
                    className="h-20 rounded-xl object-contain"
                  />
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-on-surface-variant">
                      <Image size={24} />
                    </div>
                    <span className="text-body-sm text-on-surface-variant">
                      Clique para selecionar uma imagem
                    </span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-border-low-contrast pt-5 mt-1">
              <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)} disabled={actionLoading}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={actionLoading}>
                {actionLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {deleteModal.isOpen && (
        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          title="Inativar Registro"
          description={`Tem certeza que deseja inativar "${deleteModal.name}"?`}
          onConfirm={handleDelete}
          onClose={() => setDeleteModal({ isOpen: false, id: 0, name: '' })}
          disabled={actionLoading}
        />
      )}
    </>
  );
};
