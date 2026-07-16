import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { User, Empresa } from '../services/api';
import { ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { ConfirmationModal } from '../components/Modal';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FormInput } from '../components/ui/FormInput';
import { Modal } from '../components/ui/Modal';

interface UsersPageProps {
  empresas: Empresa[];
}

const roleBadgeVariant: Record<string, 'danger' | 'warning' | 'info'> = {
  superadmin: 'danger',
  manager: 'warning',
  employee: 'info',
};

const roleLabel: Record<string, string> = {
  superadmin: 'Super Admin',
  manager: 'Gerente',
  employee: 'Funcionário',
};

export const UsersPage: React.FC<UsersPageProps> = ({ empresas }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setUserPassword('');
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
      active: userActive,
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

  const handleDeleteUser = async () => {
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
      <div className="flex flex-col gap-6">
        <div className="flex justify-end">
          <Button variant="primary" onClick={openCreateForm}>
            Novo Usuário
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-status-critical/10 border border-status-critical/20 text-status-critical px-4 py-3 rounded-xl">
            <ShieldAlert size={20} />
            <span className="text-body-sm">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-on-surface-variant">Carregando usuários...</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-low-contrast bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-subtle border-b border-border-low-contrast">
                  <th className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant">Nome</th>
                  <th className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant">E-mail</th>
                  <th className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant">Papel</th>
                  <th className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant">Empresa Vinculada</th>
                  <th className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant">Status</th>
                  <th className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const company = empresas.find(e => e.id === u.empresa_id);
                  return (
                    <tr key={u.id} className="border-b border-border-low-contrast/50 hover:bg-surface-subtle transition-colors">
                      <td className="px-4 py-3 text-body-sm font-semibold text-on-surface">{u.name}</td>
                      <td className="px-4 py-3 text-body-sm text-on-surface-variant">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={roleBadgeVariant[u.role]}>{roleLabel[u.role]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-body-sm text-on-surface-variant">
                        {company ? company.name : <em className="text-muted-foreground">Geral (Sem vínculo)</em>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.active ? 'success' : 'danger'}>{u.active ? 'Ativo' : 'Inativo'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openEditForm(u)}>
                            Editar
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => confirmDelete(u.id, u.name)}>
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-on-surface-variant">
                      Nenhum usuário cadastrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={`${editingId ? 'Editar' : 'Novo'} Usuário`}
        >
          <form onSubmit={handleSave} className="flex flex-col gap-5 p-6">
            <FormInput
              label="Nome Completo"
              placeholder="Ex: João Silva"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              required
              disabled={actionLoading}
            />
            <FormInput
              label="E-mail (Login)"
              type="email"
              placeholder="Ex: joao@exemplo.com"
              value={userEmail}
              onChange={e => setUserEmail(e.target.value)}
              required
              disabled={actionLoading}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-label-md text-on-surface-variant">
                {editingId ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3.5 py-3 text-body-sm rounded-xl border border-border-low-contrast bg-white text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10 pr-12"
                  placeholder={editingId ? '••••••••' : 'Mínimo 6 caracteres'}
                  value={userPassword}
                  onChange={e => setUserPassword(e.target.value)}
                  required={!editingId}
                  disabled={actionLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer border-none bg-none p-2 flex items-center"
                  disabled={actionLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-label-md font-label-md text-on-surface-variant">Papel</label>
                <select
                  className="px-3.5 py-3 text-body-sm rounded-xl border border-border-low-contrast bg-white text-on-surface outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  value={userRole}
                  onChange={e => setUserRole(e.target.value as any)}
                  disabled={actionLoading}
                >
                  <option value="superadmin">Super Admin</option>
                  <option value="manager">Gerente</option>
                  <option value="employee">Funcionário</option>
                </select>
              </div>

              {userRole !== 'superadmin' ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-label-md font-label-md text-on-surface-variant">Empresa</label>
                  <select
                    className="px-3.5 py-3 text-body-sm rounded-xl border border-border-low-contrast bg-white text-on-surface outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
                    value={userEmpresaId}
                    onChange={e => setUserEmpresaId(e.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="">Selecione...</option>
                    {empresas.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-label-md font-label-md text-on-surface-variant">Empresa</label>
                  <div className="px-3.5 py-3 text-body-sm rounded-xl border border-border-low-contrast bg-surface-subtle text-on-surface-variant">
                    Acesso global (sem vínculo)
                  </div>
                </div>
              )}
            </div>

            <label className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-surface-subtle border border-border-low-contrast cursor-pointer select-none">
              <input
                type="checkbox"
                checked={userActive}
                onChange={e => setUserActive(e.target.checked)}
                disabled={actionLoading}
                className="w-[18px] h-[18px] accent-primary rounded"
              />
              <span className="text-body-sm font-label-md text-on-surface">Usuário Ativo</span>
            </label>

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
          title="Excluir Usuário"
          description={`Tem certeza que deseja excluir o usuário "${deleteModal.name}"?`}
          onConfirm={handleDeleteUser}
          onClose={() => setDeleteModal({ isOpen: false, id: 0, name: '' })}
          disabled={actionLoading}
        />
      )}
    </>
  );
};
