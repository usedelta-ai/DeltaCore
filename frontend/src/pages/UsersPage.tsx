import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { User, Empresa } from '../services/api';
import { Pencil, Trash2, UserPlus, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { ConfirmationModal } from '../components/Modal';

interface UsersPageProps {
  empresas: Empresa[];
}

export const UsersPage: React.FC<UsersPageProps> = ({ empresas }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userRole, setUserRole] = useState<'superadmin' | 'manager' | 'employee'>('employee');
  const [userEmpresaId, setUserEmpresaId] = useState<string>('');
  const [userActive, setUserActive] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number; name: string }>({
    isOpen: false,
    id: 0,
    name: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateForm = () => {
    setEditingId(null);
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    setShowPassword(false);
    setUserRole('employee');
    setUserEmpresaId('');
    setUserActive(true);
    setError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (user: User) => {
    setEditingId(user.id);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserPassword(''); // Leave empty to keep unchanged
    setShowPassword(false);
    setUserRole(user.role);
    setUserEmpresaId(user.empresa_id ? String(user.empresa_id) : '');
    setUserActive(user.active);
    setError(null);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    const payload: Partial<User> = {
      name: userName,
      email: userEmail,
      role: userRole,
      empresa_id: userRole === 'superadmin' ? null : (userEmpresaId ? Number(userEmpresaId) : null),
      active: userActive
    };

    if (userPassword) {
      payload.password = userPassword;
    }

    try {
      if (editingId) {
        await api.updateUser(editingId, payload);
      } else {
        if (!userPassword) {
          throw new Error('Senha é obrigatória para novos usuários');
        }
        await api.createUser(payload);
      }
      setIsFormOpen(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar usuário');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = (id: number, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await api.deleteUser(deleteModal.id);
      setDeleteModal({ isOpen: false, id: 0, name: '' });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar usuário');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={openCreateForm}>
            <UserPlus size={16} /> Novo Usuário
          </button>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444', padding: '16px', borderRadius: 'var(--radius)'
          }}>
            <ShieldAlert size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Users Table */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>Carregando usuários...</div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Papel</th>
                  <th>Empresa Vinculada</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const company = empresas.find(e => e.id === u.empresa_id);
                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'superadmin' ? 'badge-danger' : u.role === 'manager' ? 'badge-warning' : 'badge-info'}`}>
                          {u.role === 'superadmin' ? 'Super Admin' : u.role === 'manager' ? 'Gerente' : 'Funcionário'}
                        </span>
                      </td>
                      <td>{company ? company.name : <em style={{ color: 'hsl(var(--muted-foreground))' }}>Geral (Sem vínculo)</em>}</td>
                      <td>
                        <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>
                          {u.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEditForm(u)}>
                            <Pencil size={12} /> Editar
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => confirmDelete(u.id, u.name)}>
                            <Trash2 size={12} /> Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'hsl(var(--muted-foreground))' }}>
                      Nenhum usuário cadastrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
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
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                {editingId ? 'Editar' : 'Novo'} Usuário
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="btn-ghost" style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '18px',
                color: 'hsl(var(--muted-foreground))', background: 'transparent',
              }}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Nome Completo</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: João Silva"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  required disabled={actionLoading}
                  style={{ padding: '12px 14px', fontSize: '14px', borderRadius: '10px' }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>E-mail (Login)</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Ex: joao@exemplo.com"
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                  required disabled={actionLoading}
                  style={{ padding: '12px 14px', fontSize: '14px', borderRadius: '10px' }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                  {editingId ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder={editingId ? '••••••••' : 'Mínimo 6 caracteres'}
                    value={userPassword}
                    onChange={e => setUserPassword(e.target.value)}
                    required={!editingId}
                    disabled={actionLoading}
                    style={{ padding: '12px 48px 12px 14px', fontSize: '14px', borderRadius: '10px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'hsl(var(--muted-foreground))',
                      cursor: 'pointer', border: 'none', background: 'none',
                      display: 'flex', alignItems: 'center', padding: '8px',
                    }}
                    disabled={actionLoading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Papel</label>
                  <select
                    className="form-control"
                    value={userRole}
                    onChange={e => setUserRole(e.target.value as any)}
                    disabled={actionLoading}
                    style={{ padding: '12px 14px', fontSize: '14px', borderRadius: '10px' }}
                  >
                    <option value="superadmin">Super Admin</option>
                    <option value="manager">Gerente</option>
                    <option value="employee">Funcionário</option>
                  </select>
                </div>

                {userRole !== 'superadmin' ? (
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Empresa</label>
                    <select
                      className="form-control"
                      value={userEmpresaId}
                      onChange={e => setUserEmpresaId(e.target.value)}
                      disabled={actionLoading}
                      style={{ padding: '12px 14px', fontSize: '14px', borderRadius: '10px' }}
                    >
                      <option value="">Selecione...</option>
                      {empresas.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Empresa</label>
                    <div style={{
                      padding: '12px 14px', fontSize: '14px', borderRadius: '10px',
                      background: 'hsl(var(--background))',
                      color: 'hsl(var(--muted-foreground))',
                      border: '1px solid hsl(var(--card-border))',
                    }}>
                      Acesso global (sem vínculo)
                    </div>
                  </div>
                )}
              </div>

              <label style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px', borderRadius: '10px',
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--card-border))',
                cursor: 'pointer', margin: 0,
              }}>
                <input
                  type="checkbox"
                  checked={userActive}
                  onChange={e => setUserActive(e.target.checked)}
                  disabled={actionLoading}
                  style={{ width: '18px', height: '18px', accentColor: 'hsl(var(--primary))' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Usuário Ativo</span>
              </label>

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

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Excluir Usuário"
        description={`Tem certeza que deseja inativar o usuário "${deleteModal.name}"?`}
        onConfirm={handleDelete}
        onClose={() => setDeleteModal({ isOpen: false, id: 0, name: '' })}
        disabled={actionLoading}
      />
    </>
  );
};
