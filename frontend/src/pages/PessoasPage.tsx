import React, { useState, useEffect, useMemo } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { FormInput } from '../components/ui/FormInput';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { usePessoas } from '../hooks/usePessoas';

interface PessoasPageProps {
  onPessoaClick: (id: number) => void;
}

export const PessoasPage: React.FC<PessoasPageProps> = ({ onPessoaClick }) => {
  const { pessoas, loading, error, createPessoa, isCreating } = usePessoas();
  const [searchQuery, setSearchQuery] = useState('');

  // Creation state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreatePessoa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    setCreateError(null);
    try {
      await createPessoa({ name: newName, phone: newPhone });
      setIsCreateOpen(false);
      setNewName('');
      setNewPhone('');
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao cadastrar pessoa');
    }
  };

  const filteredPessoas = useMemo(() => {
    if (!searchQuery.trim()) return pessoas;
    const q = searchQuery.toLowerCase();
    return pessoas.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q)
    );
  }, [pessoas, searchQuery]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pessoas]);

  const totalPages = Math.ceil(filteredPessoas.length / itemsPerPage);
  const paginatedPessoas = useMemo(() => {
    return filteredPessoas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredPessoas, currentPage]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-on-surface">Cadastro de Pessoas</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Lista de contatos unificados cadastrados no sistema.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-low-contrast rounded-xl text-body-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>
          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="cursor-pointer font-bold whitespace-nowrap inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Nova Pessoa
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-status-critical/10 border border-status-critical/20 text-status-critical px-4 py-3 rounded-xl">
          <ShieldAlert size={20} />
          <span className="text-body-sm">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-on-surface-variant">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Carregando contatos...</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border-low-contrast bg-white shadow-sm flex flex-col overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-290px)]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-subtle border-b border-border-low-contrast text-label-md font-bold text-on-surface-variant sticky top-0 bg-white z-10">
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Telefone</th>
                  <th className="px-6 py-4">Data de Cadastro</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-low-contrast text-body-sm">
                {paginatedPessoas.map(p => (
                  <tr key={p.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="px-6 py-4 font-bold text-on-surface">{p.name}</td>
                    <td className="px-6 py-4 font-mono text-on-surface-variant">{p.phone}</td>
                    <td className="px-6 py-4 text-on-surface-variant font-medium">{formatDate(p.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onPessoaClick(p.id)}
                        className="inline-flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <span className="material-symbols-outlined text-[16px]">contact_page</span>
                        Ver Cadastro
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredPessoas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-on-surface-variant italic">
                      Nenhum contato encontrado
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
            totalItems={filteredPessoas.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Cadastrar Nova Pessoa"
        >
          <form onSubmit={handleCreatePessoa} className="flex flex-col gap-5 p-6">
            <FormInput
              label="Nome Completo"
              placeholder="Ex: Maria Oliveira"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
              disabled={isCreating}
            />
            <FormInput
              label="Telefone (WhatsApp)"
              placeholder="Ex: 5511999999999"
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
              required
              disabled={isCreating}
            />
            {createError && (
              <p className="text-[11px] text-status-critical font-bold">{createError}</p>
            )}
            <p className="text-[11px] text-on-surface-variant leading-relaxed italic bg-surface-container-low p-3 rounded-lg border border-border-low-contrast/50">
              💡 Ao cadastrar, o sistema irá buscar e vincular automaticamente todos os leads existentes que possuam este mesmo número de telefone!
            </p>
            <div className="flex justify-end gap-2.5 border-t border-border-low-contrast pt-5 mt-1">
              <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isCreating}>
                {isCreating ? 'Salvando...' : 'Cadastrar e Vincular'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
