import React, { useState, useEffect } from 'react';
import { TimelineDots } from './TimelineDots';
import type { TimelineDot } from './TimelineDots';
import { api } from '../../services/api';
import type { Lead, Agent, LeadStatus } from '../../services/api';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Select } from '../ui/Select';

interface LeadCoreInfoPanelProps {
  lead: Lead;
  timelineDots?: TimelineDot[];
  formatCurrency: (val: number | null) => string;
  formatDate: (dateStr: string | null | undefined) => string;
  onViewAllTimeline?: () => void;
  agents?: Agent[];
  onUpdateLead?: (updateData: Partial<Lead>) => Promise<void>;
  hasWritePermission?: boolean;
  isSuperAdmin?: boolean;
  onPessoaClick?: (pessoaId: number) => void;
  onCreatePessoa?: (pessoaId: number) => void;
}

// Key formatting with translation helper
const formatKey = (key: string, trans: Record<string, string> | null) => {
  if (!key) return '';
  if (trans && trans[key]) return trans[key];
  const defaultTranslations: Record<string, string> = {
    room_type: 'Tipo de Quarto',
    guest_count: 'Hóspedes',
    check_in_date: 'Check-in',
    check_out_date: 'Check-out',
    children_count: 'Crianças',
    adults_count: 'Adultos',
    phone: 'Telefone',
    email: 'E-mail',
    city: 'Cidade',
    state: 'Estado',
    country: 'País',
    notes: 'Observações',
    reservation_code: 'Código da Reserva',
    created_at: 'Criado em',
    updated_at: 'Atualizado em',
    conversation_summary: 'Resumo da Conversa'
  };
  if (defaultTranslations[key]) return defaultTranslations[key];
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Date parser helper for inputs
export const LeadCoreInfoPanel: React.FC<LeadCoreInfoPanelProps> = ({
  lead,
  timelineDots,
  formatCurrency: _formatCurrency,
  formatDate,
  onViewAllTimeline,
  agents = [],
  onUpdateLead,
  hasWritePermission = true,
  isSuperAdmin = false,
  onPessoaClick,
  onCreatePessoa,
}) => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Criar Cadastro dialog states
  const [showConfirmCreate, setShowConfirmCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createFeedback, setCreateFeedback] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);

  // Input states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<LeadStatus>('NOVO');
  const [agentId, setAgentId] = useState<number>(0);

  // Custom properties list state: { key: string, value: string }
  const [customProps, setCustomProps] = useState<{ id: string; key: string; value: string }[]>([]);

  // Find agent translations and schema
  const agent = agents.find(a => a.id === lead.agent_id);
  const translations = React.useMemo(() => {
    let trans: Record<string, string> = {};
    if (agent && agent.translations) {
      try {
        trans = typeof agent.translations === 'string' ? JSON.parse(agent.translations) : agent.translations;
      } catch (_) {}
    }
    return trans;
  }, [agent]);

  const schemaFields = React.useMemo(() => {
    if (!agent?.custom_properties_schema) return [];
    try {
      const s = typeof agent.custom_properties_schema === 'string'
        ? JSON.parse(agent.custom_properties_schema)
        : agent.custom_properties_schema;
      if (s && Array.isArray(s.fields)) return s.fields as Array<{ key: string; label: string; type: string; required: boolean; placeholder?: string; options?: { value: string; label: string }[] }>;
    } catch (_) {}
    return [];
  }, [agent]);

  const schemaMap = React.useMemo(() => {
    const map = new Map<string, typeof schemaFields[number]>();
    schemaFields.forEach(f => map.set(f.key, f));
    return map;
  }, [schemaFields]);

  // Sync state with incoming lead changes
  useEffect(() => {
    setName(lead.name || '');
    setPhone(lead.remote_jid_alt?.replace('@s.whatsapp.net', '') || '');
    setValue(lead.value !== null && lead.value !== undefined ? String(lead.value) : '');
    setStatus(lead.status || 'NOVO');
    setAgentId(lead.agent_id || 0);

    const cProps = lead.custom_properties || {};

    // Initialize custom properties: merge schema fields with existing values
    const existingKeys = new Set<string>();
    const customList: { id: string; key: string; value: string }[] = [];

    for (const [k, v] of Object.entries(cProps)) {
      existingKeys.add(k);
      customList.push({
        id: Math.random().toString(36).substr(2, 9),
        key: k,
        value: typeof v === 'object' ? JSON.stringify(v) : String(v),
      });
    }

    for (const field of schemaFields) {
      if (existingKeys.has(field.key)) continue;
      customList.push({
        id: Math.random().toString(36).substr(2, 9),
        key: field.key,
        value: field.type === 'boolean' ? 'false' : '',
      });
    }

    setCustomProps(customList);
  }, [lead, schemaFields]);

  const triggerSave = async (payload: Partial<Lead>) => {
    if (!onUpdateLead || !hasWritePermission) return;
    setSaveStatus('saving');
    try {
      await onUpdateLead(payload);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Erro ao atualizar campo do lead:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  const handleTextBlur = (field: string, currentVal: string, originalVal: string) => {
    if (currentVal === originalVal) return;

    if (field === 'name') {
      triggerSave({ name: currentVal || null });
    } else if (field === 'phone') {
      const suffix = lead.remote_jid_alt?.includes('@s.whatsapp.net') ? '@s.whatsapp.net' : '';
      triggerSave({ remote_jid_alt: currentVal ? `${currentVal}${suffix}` : '' });
    } else if (field === 'value') {
      triggerSave({ value: currentVal ? Number(currentVal) : null });
    } else {
      // It's a key inside custom_properties
      const updatedProps = { ...(lead.custom_properties || {}) };
      triggerSave({ custom_properties: updatedProps });
    }
  };

  const handleSelectChange = (field: 'status' | 'agent_id', val: any) => {
    if (field === 'status') {
      const newStatus = val as LeadStatus;
      if (newStatus === lead.status) return;
      setStatus(newStatus);
      const statusMap: Record<string, string> = {
        'NOVO': 'Novo Lead',
        'HUMANO': 'Em Atendimento',
        'FINALIZADO': 'Finalizado',
        'CONCLUIDO': 'Faturado',
        'CANCELADO': 'Cancelado'
      };
      const statusText = statusMap[newStatus] || newStatus;
      triggerSave({ 
        status: newStatus,
        taken_motive: `Status alterado para ${statusText} inline`
      });
    } else if (field === 'agent_id') {
      const newAgentId = Number(val);
      if (newAgentId === lead.agent_id) return;
      setAgentId(newAgentId);
      triggerSave({ agent_id: newAgentId });
    }
  };

  // Custom properties updates
  const handleCustomPropChange = (id: string, newVal: string) => {
    setCustomProps(prev =>
      prev.map(item => (item.id === id ? { ...item, value: newVal } : item))
    );
  };

  const saveCustomProps = (targetPropsList = customProps) => {
    const updatedProps: Record<string, any> = {};
    targetPropsList.forEach(item => {
      if (item.key.trim()) {
        // Try parsing booleans before saving
        let val: any = item.value;
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (val !== '' && !isNaN(Number(val))) val = Number(val);

        updatedProps[item.key.trim()] = val;
      }
    });
    triggerSave({ custom_properties: updatedProps });
  };

  return (
    <>
    <section className="w-[320px] bg-white border-r border-border-low-contrast flex flex-col">
      <div className="p-6 overflow-y-auto flex-1">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-headline-md text-body-lg font-bold flex items-center gap-2 m-0">
            <span className="material-symbols-outlined text-primary">info</span>

            Informações do Lead
          </h3>
          {saveStatus === 'saving' && (
            <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold animate-pulse">
              Salvando...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-[11px] bg-status-success/15 text-status-success px-2 py-0.5 rounded-full font-bold">
              ✓ Salvo
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-[11px] bg-status-critical/15 text-status-critical px-2 py-0.5 rounded-full font-bold">
              ⚠️ Erro
            </span>
          )}
        </div>

        <div className="space-y-5">
          {/* Nome */}
          <div className="group">
            <label className="block text-label-md font-label-md text-on-surface-variant mb-1 ml-1">Nome</label>
            <input
              className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl px-4 py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none disabled:opacity-70"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => handleTextBlur('name', name, lead.name || '')}
              disabled={!hasWritePermission}
              placeholder="Sem nome"
            />
          </div>

          {/* Telefone */}
          <div className="group">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-label-md font-label-md text-on-surface-variant ml-1">Telefone</label>
              {lead.pessoa_id ? (
                <button
                  type="button"
                  onClick={() => onPessoaClick?.(lead.pessoa_id!)}
                  title="Ver Cadastro de Pessoa"
                  className="text-[11px] text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0"
                >
                  <span className="material-symbols-outlined text-[13px]">contact_page</span>
                  Ver Pessoa
                </button>
              ) : (
                phone && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!name.trim()) {
                        setCreateFeedback({ type: 'error', title: 'Nome obrigatório', message: 'O nome do lead é necessário para criar o cadastro.' });
                        return;
                      }
                      setShowConfirmCreate(true);
                    }}
                    title="Criar cadastro unificado para este telefone"
                    className="text-[11px] text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0"
                  >
                    <span className="material-symbols-outlined text-[13px]">person_add</span>
                    Criar Cadastro
                  </button>
                )
              )}
            </div>
            <input
              className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl px-4 py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none disabled:opacity-70"
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onBlur={() => handleTextBlur('phone', phone, lead.remote_jid_alt?.replace('@s.whatsapp.net', '') || '')}
              disabled={!hasWritePermission}
              placeholder="Sem telefone"
            />
          </div>

          {/* Valor Estimado */}
          <div className="group">
            <label className="block text-label-md font-label-md text-on-surface-variant mb-1 ml-1">Valor Estimado</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">R$</span>
              <input
                className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl pl-9 pr-4 py-2 text-body-md font-bold text-primary focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none disabled:opacity-70"
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                onBlur={() => handleTextBlur('value', value, lead.value !== null && lead.value !== undefined ? String(lead.value) : '')}
                disabled={!hasWritePermission}
                placeholder="0"
              />
            </div>
          </div>

          {/* Status */}
          <div className="group">
            <label className="block text-label-md font-label-md text-on-surface-variant mb-1 ml-1">Status</label>
            <Select
              options={[
                { value: 'NOVO', label: 'Novo Lead' },
                { value: 'HUMANO', label: 'Em Atendimento' },
                { value: 'FINALIZADO', label: 'Finalizado' },
                { value: 'CONCLUIDO', label: 'Faturado' },
                { value: 'CANCELADO', label: 'Cancelado' }
              ]}
              value={status}
              onChange={e => handleSelectChange('status', e.target.value)}
              disabled={!hasWritePermission}
            />
          </div>

          {/* Agente Responsável */}
          <div className="group">
            <label className="block text-label-md font-label-md text-on-surface-variant mb-1 ml-1">Agente Responsável</label>
            <Select
              options={[
                { value: 0, label: 'Não atribuído (Sem agente)' },
                ...agents.map(ag => ({ value: ag.id, label: ag.name }))
              ]}
              value={agentId}
              onChange={e => handleSelectChange('agent_id', e.target.value)}
              disabled={!hasWritePermission || !isSuperAdmin}
            />
          </div>

          {/* Motivo da Transferência */}
          {lead.taken_motive && (
            <div className="group bg-secondary-container/5 border border-secondary/25 p-3.5 rounded-xl text-secondary">
              <label className="block text-label-md font-bold uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">info</span> Motivo da Transferência
              </label>
              <p className="text-body-sm text-on-surface-variant leading-relaxed font-medium">
                {lead.taken_motive}
              </p>
            </div>
          )}
        </div>

        {/* Custom Properties Section */}
        <div className="mt-8 pt-6 border-t border-border-low-contrast">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider m-0">
              Propriedades Personalizadas
            </h4>
          </div>

          <div className="space-y-4">
            {customProps.map(item => {
              const label = formatKey(item.key, translations);
              const schemaField = schemaMap.get(item.key);

              return (
                <div key={item.id} className="group flex flex-col gap-1.5 bg-surface-container-highest/15 p-3 rounded-xl border border-border-low-contrast/50">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-primary ml-0.5">
                    {label}
                  </span>

                  {schemaField?.type === 'textarea' ? (
                    <textarea
                      value={item.value}
                      onChange={e => handleCustomPropChange(item.id, e.target.value)}
                      onBlur={() => saveCustomProps()}
                      disabled={!hasWritePermission}
                      rows={4}
                      className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-lg p-2 text-body-sm text-on-surface-variant focus:ring-1 focus:ring-primary focus:border-transparent outline-none resize-y transition-all disabled:opacity-70"
                    />
                  ) : schemaField?.type === 'boolean' ? (
                    <Select
                      options={[
                        { value: 'true', label: 'Sim' },
                        { value: 'false', label: 'Não' }
                      ]}
                      value={String(item.value)}
                      onChange={e => {
                        handleCustomPropChange(item.id, String(e.target.value));
                        const updated = customProps.map(p => p.id === item.id ? { ...p, value: String(e.target.value) } : p);
                        saveCustomProps(updated);
                      }}
                      disabled={!hasWritePermission}
                    />
                  ) : schemaField?.type === 'select' ? (
                    <Select
                      options={schemaField.options || []}
                      value={item.value}
                      onChange={e => {
                        handleCustomPropChange(item.id, String(e.target.value));
                        const updated = customProps.map(p => p.id === item.id ? { ...p, value: String(e.target.value) } : p);
                        saveCustomProps(updated);
                      }}
                      disabled={!hasWritePermission}
                    />
                  ) : schemaField?.type === 'date' ? (
                    <input
                      type="date"
                      value={item.value}
                      onChange={e => {
                        handleCustomPropChange(item.id, e.target.value);
                        const updated = customProps.map(p => p.id === item.id ? { ...p, value: e.target.value } : p);
                        saveCustomProps(updated);
                      }}
                      disabled={!hasWritePermission}
                      className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-lg p-2 text-body-sm text-on-surface focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-70"
                    />
                  ) : schemaField?.type === 'number' ? (
                    <input
                      type="number"
                      value={item.value}
                      onChange={e => handleCustomPropChange(item.id, e.target.value)}
                      onBlur={() => saveCustomProps()}
                      disabled={!hasWritePermission}
                      className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-lg px-3 py-1.5 text-body-sm text-on-surface focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-70"
                    />
                  ) : (
                    <input
                      type={!isNaN(Number(item.value)) && item.value !== '' ? 'number' : 'text'}
                      value={item.value}
                      onChange={e => handleCustomPropChange(item.id, e.target.value)}
                      onBlur={() => saveCustomProps()}
                      disabled={!hasWritePermission}
                      className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-lg px-3 py-1.5 text-body-sm text-on-surface focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-70"
                    />
                  )}
                </div>
              );
            })}

            {customProps.length === 0 && (
              <p className="text-body-sm text-on-surface-variant/60 italic text-center py-2 m-0">
                Nenhuma propriedade personalizada adicional.
              </p>
            )}
          </div>
        </div>

        {/* Date Details */}
        <div className="mt-8 pt-6 border-t border-border-low-contrast space-y-1 text-body-sm text-on-surface-variant">
          <div><strong>Criado:</strong> {formatDate(lead.created_at)}</div>
          {lead.taken_over_at && <div><strong>Assumido:</strong> {formatDate(lead.taken_over_at)}</div>}
          {lead.updated_at && <div><strong>Atualizado:</strong> {formatDate(lead.updated_at)}</div>}
        </div>
      </div>

      {timelineDots && <TimelineDots dots={timelineDots} onViewAll={onViewAllTimeline} />}
    </section>

    {/* Confirm create pessoa modal */}
    {showConfirmCreate && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => !createLoading && setShowConfirmCreate(false)}>
        <div
          className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm flex flex-col gap-4 border border-border-low-contrast"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex gap-4 items-start">
            <div className="bg-primary/10 p-3 rounded-full flex-shrink-0 flex items-center justify-center">
              <AlertTriangle size={26} className="text-primary" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-on-surface mb-1">Criar Cadastro de Pessoa</h3>
              <p className="text-body-sm text-on-surface-variant">
                Deseja criar um cadastro para <strong>"{name}"</strong> com o telefone <strong className="font-mono">{phone}</strong>?
              </p>
              <p className="text-[11px] italic text-on-surface-variant mt-2">
                💡 Todos os leads com esse número serão vinculados automaticamente.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2 border-t border-border-low-contrast">
            <button
              onClick={() => setShowConfirmCreate(false)}
              disabled={createLoading}
              className="px-4 py-2 rounded-xl border border-border-low-contrast text-on-surface-variant font-bold text-sm hover:bg-surface-container transition-colors cursor-pointer bg-white"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                setCreateLoading(true);
                try {
                  const newPessoa = await api.createPessoa({ name, phone });
                  if (onUpdateLead) {
                    await onUpdateLead({ pessoa_id: newPessoa.id });
                  }
                  setShowConfirmCreate(false);
                  setCreateFeedback({
                    type: 'success',
                    title: 'Cadastro criado!',
                    message: 'A pessoa foi cadastrada e vinculada com sucesso. Outros leads com o mesmo número também foram associados.'
                  });
                  if (onCreatePessoa) onCreatePessoa(newPessoa.id!);
                } catch (err: any) {
                  setShowConfirmCreate(false);
                  setCreateFeedback({
                    type: 'error',
                    title: 'Erro ao criar cadastro',
                    message: err.message || 'Não foi possível criar o cadastro.'
                  });
                } finally {
                  setCreateLoading(false);
                }
              }}
              disabled={createLoading}
              className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {createLoading ? 'Criando...' : 'Criar e Vincular'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Feedback modal (success/error) */}
    {createFeedback && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setCreateFeedback(null)}>
        <div
          className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm flex flex-col items-center text-center gap-4 border border-border-low-contrast"
          onClick={e => e.stopPropagation()}
        >
          {createFeedback.type === 'success' ? (
            <CheckCircle size={52} className="text-status-success" />
          ) : (
            <XCircle size={52} className="text-status-critical" />
          )}
          <div>
            <h3 className="text-lg font-extrabold text-on-surface mb-1">{createFeedback.title}</h3>
            <p className="text-body-sm text-on-surface-variant">{createFeedback.message}</p>
          </div>
          <button
            onClick={() => setCreateFeedback(null)}
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    )}
  </>
  );
};

