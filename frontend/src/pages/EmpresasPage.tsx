import React, { useState } from 'react';
import { Pencil, Trash2, Image, Copy, Check } from 'lucide-react';
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
  const [copiedId, setCopiedId] = useState<number | null>(null);

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

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '24px',
        padding: '8px 0 24px 0'
      }}>
        {visibleEmpresas.map(emp => (
          <div 
            key={emp.id} 
            className="card" 
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderRadius: '20px',
              border: '1px solid hsla(var(--card-border) / 0.6)',
              background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsla(var(--card) / 0.9) 100%)',
              padding: '24px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
              opacity: emp.active ? 1 : 0.7,
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 30px -10px rgba(0, 0, 0, 0.12)';
              e.currentTarget.style.borderColor = 'hsla(var(--primary) / 0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.borderColor = 'hsla(var(--card-border) / 0.6)';
            }}
          >
            {/* Top Info Header */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                {emp.logo ? (
                  <img 
                    src={`data:image/png;base64,${emp.logo}`} 
                    alt={emp.name} 
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      objectFit: 'cover',
                      border: '1px solid hsla(var(--card-border) / 0.8)',
                      boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.08)'
                    }} 
                  />
                ) : (
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, hsla(262, 83%, 58%, 0.15) 0%, hsla(262, 83%, 58%, 0.05) 100%)',
                    color: 'hsl(var(--primary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 700,
                    border: '1px solid hsla(var(--primary) / 0.15)'
                  }}>
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  backgroundColor: emp.active ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  color: emp.active ? '#10b981' : '#ef4444',
                  border: emp.active ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)'
                }}>
                  {emp.active ? 'Ativa' : 'Inativa'}
                </span>
              </div>

              <h3 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'hsl(var(--foreground))',
                margin: '0 0 6px 0',
                letterSpacing: '-0.5px',
                lineHeight: '1.3'
              }}>
                {emp.name}
              </h3>
              
              <div style={{
                fontSize: '12px',
                color: 'hsl(var(--muted-foreground))',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginBottom: '24px'
              }}>
                <span>Registrada em:</span>
                <strong style={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}>
                  {new Date(emp.created_at).toLocaleDateString()}
                </strong>
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              borderTop: '1px solid hsla(var(--card-border) / 0.5)',
              paddingTop: '16px',
              marginTop: 'auto'
            }}>
              {emp.active && (
                <>
                  <a 
                    href={getBoardUrl(emp.id, emp.name)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-primary btn-sm" 
                    style={{
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px -2px hsla(262, 83%, 58%, 0.2)'
                    }}
                  >
                    🔗 Board
                  </a>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => handleCopyLink(emp.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontWeight: 600,
                      backgroundColor: 'hsl(var(--secondary))',
                      border: '1px solid hsla(var(--card-border) / 0.6)'
                    }}
                  >
                    {copiedId === emp.id ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                    {copiedId === emp.id ? 'Copiado!' : 'Copiar Login'}
                  </button>
                  {hasWritePermission && (
                    <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => openEditForm(emp)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'hsl(var(--muted-foreground))'
                        }}
                        title="Editar Empresa"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => confirmDelete(emp.id, emp.name)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ef4444'
                        }}
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
