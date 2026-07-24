import React, { useState, useMemo } from 'react';
import type { Empresa } from '../services/api';
import { api } from '../services/api';
import { ShieldAlert, Eye, EyeOff, KeyRound } from 'lucide-react';
import { ConfirmationModal } from '../components/Modal';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FormInput } from '../components/ui/FormInput';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { useUsers } from '../hooks/useUsers';

interface UsersPageProps {
  empresas: Empresa[];
  token: string | null;
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

export const UsersPage: React.FC<UsersPageProps> = ({ empresas, token }) => {
  const [filterEmpresaId, setFilterEmpresaId] = useState<string>('');
  const { users, loading, error: queryError, createUser, updateUser, deleteUser, isActionLoading } = useUsers(token, filterEmpresaId || undefined);

  const [formError, setFormError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userRole, setUserRole] = useState<'superadmin' | 'manager' | 'employee'>('employee');
  const [userEmpresaId, setUserEmpresaId] = useState<string>('');
  const [userActive, setUserActive] = useState(true);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number; name: string }>({
    isOpen: false,
    id: 0,
    name: '',
  });

  const [resetPasswordModal, setResetPasswordModal] = useState<{ isOpen: boolean; id: number; name: string }>({
    isOpen: false,
    id: 0,
    name: '',
  });
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetShowPassword, setResetShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    return users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [users, currentPage]);

  const openCreateForm = () => {
    setEditingId(null);
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    setShowPassword(false);
    setUserRole('employee');
    setUserEmpresaId('');
    setUserActive(true);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (user: ReturnType<typeof useUsers>['users'][number]) => {
    setEditingId(user.id);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserPassword('');
    setShowPassword(false);
    setUserRole(user.role);
    setUserEmpresaId(user.empresa_id ? String(user.empresa_id) : '');
    setUserActive(user.active);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      name: userName,
      email: userEmail,
      role: userRole,
      empresa_id: userRole === 'superadmin' ? null : (userEmpresaId ? Number(userEmpresaId) : null),
      active: userActive,
      ...(userPassword ? { password: userPassword } : {}),
    };

    try {
      if (editingId) {
        await updateUser(editingId, payload);
      } else {
        if (!userPassword) {
          setFormError('Senha é obrigatória para novos usuários');
          return;
        }
        await createUser(payload);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar usuário');
    }
  };

  const confirmDelete = (id: number, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUser(deleteModal.id);
      setDeleteModal({ isOpen: false, id: 0, name: '' });
    } catch (err: any) {
      setFormError(err.message || 'Erro ao deletar usuário');
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-label-md font-label-md text-on-surface-variant">Filtrar por Empresa:</label>
            <select
              className="px-3 py-2 text-body-sm rounded-xl border border-border-low-contrast bg-white text-on-surface outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
              value={filterEmpresaId}
              onChange={e => setFilterEmpresaId(e.target.value)}
            >
              <option value="">Todas as Empresas</option>
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <Button variant="primary" onClick={openCreateForm}>
            Novo Usuário
          </Button>
        </div>

        {queryError && (
          <div className="flex items-center gap-3 bg-status-critical/10 border border-status-critical/20 text-status-critical px-4 py-3 rounded-xl">
            <ShieldAlert size={20} />
            <span className="text-body-sm">{queryError}</span>
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-on-surface-variant">Carregando usuários...</div>
        ) : (
          <div className="rounded-xl border border-border-low-contrast bg-white flex flex-col overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-270px)]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-subtle border-b border-border-low-contrast sticky top-0 bg-white z-10">
                    <th className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant">Nome</th>
                    <th className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant">E-mail</th>
                    <th className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant">Papel</th>
                    <th className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant">Empresa Vinculada</th>
                    <th className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant">Status</th>
                    <th className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant">Último Acesso</th>
                    <th className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map(u => {
                    const company = empresas.find(e => e.id === u.empresa_id);
                    return (
                      <tr key={u.id} className="border-b border-border-low-contrast/50 hover:bg-surface-subtle transition-colors">
                        <td className="px-4 py-3 text-body-sm font-semibold text-on-surface">{u.name}</td>
                        <td className="px-4 py-3 text-body-sm text-on-surface-variant">{u.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant={roleBadgeVariant[u.role]}>{roleLabel[u.role]}</Badge>
                        </td>
                        <td className="px-4 py-3 text-body-sm text-on-surface-variant">
                          {company ? (
                            <div className="flex items-center gap-2">
                              {company.logo && (
                                <img src={`data:image/png;base64,${company.logo}`} alt="" className="w-6 h-6 rounded-full object-cover" />
                              )}
                              <span>{company.name}</span>
                            </div>
                          ) : (
                            <em className="text-muted-foreground">Geral (Sem vínculo)</em>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={u.active ? 'success' : 'danger'}>{u.active ? 'Ativo' : 'Inativo'}</Badge>
                        </td>
                        <td className="px-4 py-3 text-body-sm text-on-surface-variant">
                          {u.last_activity_at ? new Date(u.last_activity_at).toLocaleString('pt-BR') : 'Nunca acessou'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => openEditForm(u)}>
                              Editar
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => {
                                setResetPasswordModal({ isOpen: true, id: u.id, name: u.name });
                                setResetNewPassword('');
                                setResetError(null);
                                setResetSuccess(null);
                              }}>
                                <KeyRound size={14} className="mr-1" />
                                Resetar Senha
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
                      <td colSpan={7} className="text-center py-6 text-on-surface-variant">
                        Nenhum usuário cadastrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={users.length}
              itemsPerPage={itemsPerPage}
            />
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
              disabled={isActionLoading}
            />
            <FormInput
              label="E-mail (Login)"
              type="email"
              placeholder="Ex: joao@exemplo.com"
              value={userEmail}
              onChange={e => setUserEmail(e.target.value)}
              required
              disabled={isActionLoading}
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
                  disabled={isActionLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer border-none bg-none p-2 flex items-center"
                  disabled={isActionLoading}
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
                  disabled={isActionLoading}
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
                    disabled={isActionLoading}
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
                disabled={isActionLoading}
                className="w-[18px] h-[18px] accent-primary rounded"
              />
              <span className="text-body-sm font-label-md text-on-surface">Usuário Ativo</span>
            </label>

            {formError && (
              <p className="text-[12px] text-status-critical font-bold">{formError}</p>
            )}

            <div className="flex justify-end gap-2.5 border-t border-border-low-contrast pt-5 mt-1">
              <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)} disabled={isActionLoading}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isActionLoading}>
                {isActionLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {resetPasswordModal.isOpen && (
        <Modal
          isOpen={resetPasswordModal.isOpen}
          onClose={() => setResetPasswordModal({ isOpen: false, id: 0, name: '' })}
          title={`Resetar Senha - ${resetPasswordModal.name}`}
        >
          <form onSubmit={async (e) => {
            e.preventDefault();
            setResetError(null);
            setResetSuccess(null);

            if (resetNewPassword.length < 6) {
              setResetError('A senha deve ter pelo menos 6 caracteres');
              return;
            }

            setResetLoading(true);
            try {
              await api.resetUserPassword(resetPasswordModal.id, resetNewPassword);
              setResetSuccess('Senha resetada com sucesso! O usuário deverá trocar a senha no próximo login.');
              setTimeout(() => {
                setResetPasswordModal({ isOpen: false, id: 0, name: '' });
              }, 2000);
            } catch (err: any) {
              setResetError(err.message || 'Erro ao resetar senha');
            } finally {
              setResetLoading(false);
            }
          }} className="flex flex-col gap-5 p-6">
            <p className="text-body-sm text-on-surface-variant">
              Isso irá gerar uma nova senha para <strong>{resetPasswordModal.name}</strong>.
              O usuário será forçado a trocar a senha no próximo login e todas as sessões ativas serão encerradas.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-label-md text-on-surface-variant">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={resetShowPassword ? 'text' : 'password'}
                  className="w-full px-3.5 py-3 text-body-sm rounded-xl border border-border-low-contrast bg-white text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10 pr-12"
                  placeholder="Mínimo 6 caracteres"
                  value={resetNewPassword}
                  onChange={e => setResetNewPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={resetLoading}
                />
                <button
                  type="button"
                  onClick={() => setResetShowPassword(!resetShowPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer border-none bg-none p-2 flex items-center"
                  disabled={resetLoading}
                >
                  {resetShowPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {resetError && (
              <p className="text-[12px] text-status-critical font-bold">{resetError}</p>
            )}

            {resetSuccess && (
              <p className="text-[12px] text-status-success font-bold">{resetSuccess}</p>
            )}

            <div className="flex justify-end gap-2.5 border-t border-border-low-contrast pt-5 mt-1">
              <Button type="button" variant="secondary" onClick={() => setResetPasswordModal({ isOpen: false, id: 0, name: '' })} disabled={resetLoading}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={resetLoading}>
                {resetLoading ? 'Resetando...' : 'Resetar Senha'}
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
          disabled={isActionLoading}
        />
      )}
    </>
  );
};
