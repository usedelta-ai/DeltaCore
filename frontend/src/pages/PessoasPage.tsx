import React, { useState, useEffect, useMemo } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { FormInput } from '../components/ui/FormInput';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { SkeletonView } from '../components/ui/SkeletonView';
import { LeadAvatar } from '../components/features/LeadAvatar';
import { usePessoas } from '../hooks/usePessoas';
import type { Lead } from '../services/api';

interface PessoasPageProps {
  onPessoaClick: (id: number) => void;
  leads?: Lead[];
  createTrigger?: number;
  onCreateAcknowledged?: () => void;
  isSuperAdmin?: boolean;
}

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const PessoasPage: React.FC<PessoasPageProps> = ({
  onPessoaClick,
  leads = [],
  createTrigger = 0,
  onCreateAcknowledged,
  isSuperAdmin = true,
}) => {
  const { pessoas, loading, error, createPessoa, isCreating } = usePessoas();

  const pessoaLeads = useMemo(() => {
    const map: Record<number, Lead | undefined> = {};
    for (const lead of leads) {
      if (lead.pessoa_id != null && !(lead.pessoa_id in map)) {
        map[lead.pessoa_id] = lead;
      }
    }
    return map;
  }, [leads]);

  const getInitials = (name: string): string =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  const [searchQuery, setSearchQuery] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (createTrigger > 0) {
      setIsCreateOpen(true);
      onCreateAcknowledged?.();
    }
  }, [createTrigger]);
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
    let result = pessoas;
    if (!isSuperAdmin) {
      result = result.filter(p => p.id in pessoaLeads);
    }
    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q)
    );
  }, [pessoas, searchQuery, pessoaLeads, isSuperAdmin]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pessoas]);

  const totalPages = Math.ceil(filteredPessoas.length / itemsPerPage);
  const paginatedPessoas = useMemo(() => {
    return filteredPessoas.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredPessoas, currentPage]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-on-surface">
            Cadastro de Pessoas
          </h2>
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
            <span className="material-symbols-outlined text-[18px]">
              person_add
            </span>
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
        <SkeletonView tab="leads" />
      ) : (
        <div className="w-full bg-surface border border-border-low-contrast rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-270px)]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-low-contrast bg-surface-container-low text-label-md text-on-surface-variant/80">
                  <th className="py-4 px-6 font-bold">Pessoa</th>
                  <th className="py-4 px-6 font-bold">Telefone</th>
                  <th className="py-4 px-6 font-bold">Data de Cadastro</th>
                  <th className="py-4 px-6 text-right font-bold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-low-contrast/50">
                {paginatedPessoas.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
                        <span className="material-symbols-outlined text-5xl mb-4 text-outline">
                          search_off
                        </span>
                        <p className="font-medium">
                          Nenhum contato encontrado.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPessoas.map(p => {
                    const lead = pessoaLeads[p.id];
                    const initials = getInitials(p.name);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => onPessoaClick(p.id)}
                        className="hover:bg-surface-container-lowest transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {lead ? (
                              <LeadAvatar
                                leadId={lead.id}
                                avatarType="human"
                                avatarLabel={initials}
                                className="w-9 h-9 text-xs shadow-sm"
                              />
                            ) : (
                              <div className="w-9 h-9 flex items-center justify-center text-white font-bold text-xs rounded-full shadow-sm shrink-0 bg-secondary">
                                {initials}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-semibold text-body-md text-on-surface group-hover:text-primary transition-colors">
                                {p.name}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-body-sm text-on-surface-variant">
                          {p.phone}
                        </td>
                        <td className="py-4 px-6 text-body-sm text-on-surface-variant/80">
                          {formatDate(p.created_at)}
                        </td>
                        <td
                          className="py-4 px-6 text-right"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onPessoaClick(p.id)}
                              title="Ver/Editar Cadastro de Pessoa"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface border border-border-low-contrast hover:bg-primary/5 hover:border-primary/30 hover:text-primary text-on-surface-variant transition-all cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                contact_page
                              </span>
                            </button>
                            <button
                              onClick={() => onPessoaClick(p.id)}
                              title="Ver Detalhes"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface border border-border-low-contrast hover:bg-primary/5 hover:border-primary/30 hover:text-primary text-on-surface-variant transition-all cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                chevron_right
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
              <p className="text-[11px] text-status-critical font-bold">
                {createError}
              </p>
            )}
            <p className="text-[11px] text-on-surface-variant leading-relaxed italic bg-surface-container-low p-3 rounded-lg border border-border-low-contrast/50">
              💡 Ao cadastrar, o sistema irá buscar e vincular automaticamente
              todos os leads existentes que possuam este mesmo número de
              telefone!
            </p>
            <div className="flex justify-end gap-2.5 border-t border-border-low-contrast pt-5 mt-1">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreating}
              >
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
