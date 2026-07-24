import React, { useState, useMemo, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FormInput } from '../ui/FormInput';
import { Select } from '../ui/Select';
import type { Agent, Lead, LeadStatus } from '../../services/api';

interface SchemaField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Lead>) => Promise<void>;
  agents: Agent[];
  loading?: boolean;
  selectedAgentFilter?: number;
  isSuperAdmin?: boolean;
  currentUserEmpresaId?: number | null;
}

const STATUS_OPTIONS = [
  { value: 'NOVO', label: 'Novo Lead' },
  { value: 'HUMANO', label: 'Em Atendimento' },
  { value: 'FINALIZADO', label: 'Finalizado' },
  { value: 'CONCLUIDO', label: 'Faturado' },
];

function parseSchema(agent: Agent | undefined): SchemaField[] {
  if (!agent?.custom_properties_schema) return [];
  try {
    const s = typeof agent.custom_properties_schema === 'string'
      ? JSON.parse(agent.custom_properties_schema)
      : agent.custom_properties_schema;
    if (s && Array.isArray(s.fields)) return s.fields;
    return [];
  } catch {
    return [];
  }
}

function getDefaultValue(type: string): string {
  switch (type) {
    case 'boolean': return 'false';
    default: return '';
  }
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  agents,
  selectedAgentFilter,
  isSuperAdmin = true,
  currentUserEmpresaId,
}) => {
  const filteredAgents = useMemo(() => {
    if (isSuperAdmin) return agents;
    return agents.filter(a => a.empresa_id === currentUserEmpresaId);
  }, [agents, isSuperAdmin, currentUserEmpresaId]);

  const initialAgentId = useMemo(() => {
    const target = selectedAgentFilter || filteredAgents[0]?.id || 0;
    if (filteredAgents.some(a => a.id === target)) return target;
    return filteredAgents[0]?.id || 0;
  }, []);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agentId, setAgentId] = useState<number>(initialAgentId);
  const [status, setStatus] = useState<LeadStatus>('NOVO');
  const [value, setValue] = useState('');
  const [customProps, setCustomProps] = useState<Record<string, string>>({});
  const [saveLoading, setSaveLoading] = useState(false);

  const agentOptions = useMemo(() =>
    filteredAgents.map(a => ({ value: a.id, label: a.name })),
    [filteredAgents]
  );

  const selectedAgent = useMemo(() => filteredAgents.find(a => a.id === agentId), [filteredAgents, agentId]);
  const schemaFields = useMemo(() => parseSchema(selectedAgent), [selectedAgent]);

  const handleAgentChange = useCallback((newAgentId: number) => {
    setAgentId(newAgentId);
    const agent = agents.find(a => a.id === newAgentId);
    const fields = parseSchema(agent);
    const initialProps: Record<string, string> = {};
    fields.forEach(f => {
      initialProps[f.key] = getDefaultValue(f.type);
    });
    setCustomProps(initialProps);
  }, [agents]);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    setPhone(digitsOnly);
  }, []);

  const handleCustomPropChange = useCallback((key: string, val: string) => {
    setCustomProps(prev => ({ ...prev, [key]: val }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !agentId) return;

    const customProperties: Record<string, any> = {};
    let hasError = false;

    schemaFields.forEach(field => {
      const val = customProps[field.key] || '';
      if (field.required && !val.trim()) {
        hasError = true;
        return;
      }
      if (val.trim()) {
        switch (field.type) {
          case 'number':
            customProperties[field.key] = Number(val);
            break;
          case 'boolean':
            customProperties[field.key] = val === 'true';
            break;
          default:
            customProperties[field.key] = val;
        }
      }
    });

    if (hasError) return;

    setSaveLoading(true);
    try {
      await onSave({
        name: name.trim(),
        remote_jid_alt: `${phone}@s.whatsapp.net`,
        agent_id: agentId,
        status,
        value: value ? Number(value) : null,
        custom_properties: Object.keys(customProperties).length > 0 ? customProperties : null,
      });
      onClose();
    } finally {
      setSaveLoading(false);
    }
  };

  const handleClose = () => {
    if (saveLoading) return;
    setName('');
    setPhone('');
    setAgentId(initialAgentId);
    setStatus('NOVO');
    setValue('');
    setCustomProps({});
    onClose();
  };

  const isFormValid = name.trim() && phone.trim() && phone.length >= 10 && agentId > 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Novo Lead" maxWidth="720px">
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Nome"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome do lead"
            required
          />
          <FormInput
            label="Telefone"
            type="text"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="5511999999999"
            required
            inputMode="numeric"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Agente"
            options={agentOptions}
            value={agentId}
            onChange={e => handleAgentChange(Number(e.target.value))}
          />

          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={e => setStatus(e.target.value as LeadStatus)}
          />
        </div>

        <FormInput
          label="Valor Estimado"
          type="number"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="0"
        />

        {/* Dynamic fields from schema */}
        {schemaFields.length > 0 && (
          <div className="border-t border-border-low-contrast pt-4">
            <h4 className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider mb-3">
              Propriedades Personalizadas
            </h4>
            <div className="space-y-4">
              {schemaFields.map(field => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <label className="text-label-md text-on-surface-variant font-bold uppercase tracking-wider">
                    {field.label}
                    {field.required && <span className="text-status-critical ml-1">*</span>}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      value={customProps[field.key] || ''}
                      onChange={e => handleCustomPropChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl px-3.5 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-y"
                    />
                  ) : field.type === 'select' ? (
                    <Select
                      label=""
                      options={[{ value: '', label: field.placeholder || 'Selecione...' }, ...(field.options || [])]}
                      value={customProps[field.key] || ''}
                      onChange={e => handleCustomPropChange(field.key, String(e.target.value))}
                    />
                  ) : field.type === 'boolean' ? (
                    <Select
                      label=""
                      options={[{ value: 'false', label: 'Não' }, { value: 'true', label: 'Sim' }]}
                      value={customProps[field.key] || 'false'}
                      onChange={e => handleCustomPropChange(field.key, String(e.target.value))}
                    />
                  ) : field.type === 'date' ? (
                    <input
                      type="date"
                      value={customProps[field.key] || ''}
                      onChange={e => handleCustomPropChange(field.key, e.target.value)}
                      className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl px-3.5 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  ) : field.type === 'number' ? (
                    <input
                      type="number"
                      value={customProps[field.key] || ''}
                      onChange={e => handleCustomPropChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl px-3.5 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  ) : (
                    <input
                      type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
                      value={customProps[field.key] || ''}
                      onChange={e => handleCustomPropChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full bg-surface-container-lowest border border-border-low-contrast rounded-xl px-3.5 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border-low-contrast">
          <Button variant="secondary" onClick={handleClose} disabled={saveLoading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={saveLoading || !isFormValid}>
            {saveLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
