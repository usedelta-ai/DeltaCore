import React, { useState, useEffect, useMemo } from 'react';
import { api, type Pessoa, type Lead } from '../../services/api';
import { CheckCircle, XCircle, X, ArrowLeft, User, Phone, Calendar, Save, Users } from 'lucide-react';

interface PessoaModalProps {
  pessoaId: number;
  onClose: () => void;
  onLeadClick?: (leadId: number) => void;
}

// ------ Feedback overlay ------
interface FeedbackModalProps {
  type: 'success' | 'error';
  title: string;
  message: string;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ type, title, message, onClose }) => (
  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
    <div
      className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm flex flex-col items-center text-center gap-4 border border-border-low-contrast"
      onClick={e => e.stopPropagation()}
    >
      {type === 'success'
        ? <CheckCircle size={52} className="text-status-success" />
        : <XCircle size={52} className="text-status-critical" />
      }
      <div>
        <h3 className="text-lg font-extrabold text-on-surface mb-1">{title}</h3>
        <p className="text-body-sm text-on-surface-variant">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="w-full py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
      >
        OK
      </button>
    </div>
  </div>
);

// ------ Status badge helper ------
const STATUS_MAP: Record<string, { label: string; bg: string; dot: string }> = {
  NOVO:       { label: 'Novo Lead',       bg: 'bg-blue-50 border-blue-200 text-blue-700',          dot: 'bg-blue-500' },
  HUMANO:     { label: 'Em Atendimento',  bg: 'bg-amber-50 border-amber-200 text-amber-700',        dot: 'bg-amber-500' },
  FINALIZADO: { label: 'Finalizado',      bg: 'bg-purple-50 border-purple-200 text-purple-700',     dot: 'bg-purple-500' },
  CONCLUIDO:  { label: 'Faturado',        bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',  dot: 'bg-emerald-500' },
  CANCELADO:  { label: 'Cancelado',       bg: 'bg-red-50 border-red-200 text-red-700',              dot: 'bg-red-500' },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, bg: 'bg-surface-container text-on-surface', dot: 'bg-gray-400' };
  return (
    <span className={`px-2.5 py-0.5 border rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 ${s.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
};

// ------ Main component ------
export const PessoaModal: React.FC<PessoaModalProps> = ({ pessoaId, onClose, onLeadClick }) => {
  const [pessoa, setPessoa] = useState<Pessoa | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);
  const [agentFilter, setAgentFilter] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pessoaData, leadsData] = await Promise.all([
          api.getPessoaById(pessoaId),
          api.getLeadsByPessoaId(pessoaId),
        ]);
        setPessoa(pessoaData);
        setName(pessoaData.name);
        setPhone(pessoaData.phone);
        setLeads(leadsData);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [pessoaId]);

  // Block page scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      setFeedback({ type: 'error', title: 'Campos obrigatórios', message: 'Nome e Telefone são obrigatórios.' });
      return;
    }
    setSaveStatus('saving');
    try {
      const updated = await api.updatePessoa(pessoaId, { name, phone });
      setPessoa(updated);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
      setFeedback({ type: 'success', title: 'Salvo com sucesso!', message: 'Os dados da pessoa foram atualizados.' });
    } catch (err: any) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
      setFeedback({ type: 'error', title: 'Erro ao salvar', message: err.message || 'Não foi possível salvar as alterações.' });
    }
  };

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr as string).toLocaleDateString('pt-BR', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch { return String(dateStr); }
  };

  const formatDateTime = (dateStr?: string | Date | null) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr as string).toLocaleString('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return String(dateStr); }
  };

  const formatCurrency = (val?: number | null | string) => {
    if (val === undefined || val === null || val === '') return 'R$ 0,00';
    const num = Number(val);
    if (isNaN(num)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  // Group leads by agent
  const agentNames = useMemo(() => {
    const names: Record<string, string> = {};
    leads.forEach(l => {
      if (l.agent_id) names[String(l.agent_id)] = l.agent_name || `Agente #${l.agent_id}`;
    });
    return names;
  }, [leads]);

  const filteredLeads = useMemo(() =>
    agentFilter === 'all' ? leads : leads.filter(l => String(l.agent_id) === agentFilter),
    [leads, agentFilter]
  );

  // Group filtered leads by agent for display
  const leadsByAgent = useMemo(() => {
    const groups: Record<string, Lead[]> = {};
    filteredLeads.forEach(l => {
      const key = String(l.agent_id ?? 'sem-agente');
      if (!groups[key]) groups[key] = [];
      groups[key].push(l);
    });
    return groups;
  }, [filteredLeads]);

  return (
    <>
      {/* Full-screen overlay */}
      <div className="fixed inset-0 z-[60] flex bg-surface-container-lowest animate-fade-in">

        {/* ── Left Panel: Contact card ── */}
        <aside className="w-80 flex-shrink-0 bg-white border-r border-border-low-contrast flex flex-col overflow-y-auto">
          {/* Back button */}
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-border-low-contrast flex-shrink-0">
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container border border-border-low-contrast text-on-surface-variant transition-all cursor-pointer bg-white"
              title="Fechar (Esc)"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Cadastro de Pessoa</p>
              <p className="text-sm font-extrabold text-on-surface truncate leading-tight">
                {loading ? '...' : (pessoa?.name || 'Contato')}
              </p>
            </div>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center pt-8 pb-6 px-6 border-b border-border-low-contrast">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
              <User size={36} className="text-white" />
            </div>
            {!loading && pessoa && (
              <>
                <h2 className="text-lg font-extrabold text-on-surface text-center leading-snug">{pessoa.name}</h2>
                <p className="text-sm font-mono text-on-surface-variant mt-1">{pessoa.phone}</p>
                <div className="mt-3 flex items-center gap-1.5 bg-primary/8 border border-primary/20 rounded-full px-3 py-1">
                  <Users size={13} className="text-primary" />
                  <span className="text-[12px] font-bold text-primary">{leads.length} lead{leads.length !== 1 ? 's' : ''}</span>
                </div>
              </>
            )}
          </div>

          {/* Edit form */}
          {!loading && !error && (
            <div className="flex-1 p-6 space-y-5">
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">Editar Dados</h3>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-label-md font-bold text-on-surface-variant">
                  <User size={13} /> Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="Nome completo"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-label-md font-bold text-on-surface-variant">
                  <Phone size={13} /> Telefone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl px-3.5 py-2.5 text-sm font-mono focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="5511999999999"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 shadow-md shadow-primary/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Save size={15} />
                {saveStatus === 'saving' ? 'Salvando...' : 'Salvar Alterações'}
              </button>

              {saveStatus === 'saved' && (
                <div className="flex items-center gap-2 text-status-success text-xs font-bold">
                  <CheckCircle size={13} /> Dados salvos com sucesso!
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 text-status-critical text-xs font-bold">
                  <XCircle size={13} /> Erro ao salvar
                </div>
              )}

              {/* Metadata */}
              <div className="pt-4 mt-2 border-t border-border-low-contrast space-y-2 text-[11px] text-on-surface-variant">
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  <span><strong>Cadastrado:</strong> {formatDate(pessoa?.created_at)}</span>
                </div>
                {pessoa?.updated_at && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span><strong>Atualizado:</strong> {formatDate(pessoa?.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* ── Right Panel: Leads ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-surface-container-low/40">

          {/* Top bar */}
          <header className="bg-white border-b border-border-low-contrast px-8 py-4 flex-shrink-0 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[22px]">group_work</span>
              <div>
                <h2 className="text-base font-extrabold text-on-surface leading-tight">
                  Leads Relacionados
                  <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-primary text-white text-[11px] font-extrabold rounded-full">{leads.length}</span>
                </h2>
                <p className="text-[11px] text-on-surface-variant">Todos os atendimentos deste contato</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Agent filter */}
              {Object.keys(agentNames).length > 1 && (
                <select
                  value={agentFilter}
                  onChange={e => setAgentFilter(e.target.value)}
                  className="px-3.5 py-2 text-sm border border-border-low-contrast rounded-xl bg-white text-on-surface outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="all">Todos os agentes</option>
                  {Object.entries(agentNames).map(([id, agentName]) => (
                    <option key={id} value={id}>{agentName}</option>
                  ))}
                </select>
              )}
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container border border-border-low-contrast text-on-surface-variant transition-all cursor-pointer bg-white"
                title="Fechar (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Leads content */}
          <div className="flex-1 overflow-y-auto p-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-on-surface-variant gap-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Carregando informações...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-status-critical gap-3">
                <span className="material-symbols-outlined text-6xl">error</span>
                <p className="font-semibold">{error}</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-on-surface-variant gap-4">
                <span className="material-symbols-outlined text-6xl opacity-30">layers_clear</span>
                <div className="text-center">
                  <p className="font-semibold">Nenhum lead associado</p>
                  <p className="text-sm text-on-surface-variant/70 mt-1">Leads com este telefone aparecerão aqui automaticamente.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(leadsByAgent).map(([agentId, agentLeads]) => {
                  const agentName = agentNames[agentId] || 'Sem agente';
                  return (
                    <div key={agentId}>
                      {/* Agent group header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary text-[16px]">smart_toy</span>
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-on-surface">{agentName}</p>
                          <p className="text-[11px] text-on-surface-variant">{agentLeads.length} lead{agentLeads.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="flex-1 h-px bg-border-low-contrast ml-2" />
                      </div>

                      {/* Leads table for this agent */}
                      <div className="bg-white rounded-2xl border border-border-low-contrast shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-surface-container-low border-b border-border-low-contrast text-[11px] font-extrabold uppercase tracking-wide text-on-surface-variant">
                              <th className="px-5 py-3">Lead</th>
                              <th className="px-5 py-3">Status</th>
                              <th className="px-5 py-3">Valor</th>
                              <th className="px-5 py-3">Criado em</th>
                              <th className="px-5 py-3 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-low-contrast">
                            {agentLeads.map(ld => (
                              <tr key={ld.id} className="hover:bg-surface-container-lowest transition-colors">
                                <td className="px-5 py-3.5">
                                  <div>
                                    <span className="font-extrabold text-primary text-sm">#{ld.id}</span>
                                    {ld.name && (
                                      <p className="text-xs text-on-surface-variant mt-0.5 truncate max-w-[160px]">{ld.name}</p>
                                    )}
                                  </div>
                                </td>
                                <td className="px-5 py-3.5"><StatusBadge status={ld.status} /></td>
                                <td className="px-5 py-3.5">
                                  <span className="text-sm font-bold text-status-success">{formatCurrency(ld.value)}</span>
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className="text-xs text-on-surface-variant font-medium">{formatDateTime(ld.created_at)}</span>
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  <button
                                    onClick={() => onLeadClick && ld.id && onLeadClick(ld.id)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/50 rounded-lg text-primary text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                    Abrir Lead
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback overlay */}
      {feedback && (
        <FeedbackModal
          type={feedback.type}
          title={feedback.title}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}
    </>
  );
};
