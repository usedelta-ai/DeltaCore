import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';

interface SchemaField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface SchemaVisualEditorProps {
  value: string;
  onChange: (json: string) => void;
  onSwitchToCode: () => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'email', label: 'E-mail' },
  { value: 'tel', label: 'Telefone' },
  { value: 'date', label: 'Data' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'select', label: 'Seleção (Select)' },
  { value: 'boolean', label: 'Sim/Não' },
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
];

function parseSchema(json: string): SchemaField[] {
  try {
    const parsed = JSON.parse(json);
    if (parsed && Array.isArray(parsed.fields)) return parsed.fields;
    return [];
  } catch {
    return [];
  }
}

export const SchemaVisualEditor: React.FC<SchemaVisualEditorProps> = ({
  value,
  onChange,
  onSwitchToCode,
}) => {
  const fields = useMemo(() => parseSchema(value), [value]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');

  const toggleExpand = useCallback((key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const updateSchema = useCallback((newFields: SchemaField[]) => {
    onChange(JSON.stringify({ fields: newFields }, null, 2));
  }, [onChange]);

  const updateField = useCallback((index: number, updates: Partial<SchemaField>) => {
    const newFields = fields.map((f, i) => i === index ? { ...f, ...updates } : f);
    updateSchema(newFields);
  }, [fields, updateSchema]);

  const removeField = useCallback((index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    updateSchema(newFields);
  }, [fields, updateSchema]);

  const addField = useCallback(() => {
    if (!newFieldKey.trim()) return;
    const newFields = [...fields, {
      key: newFieldKey.trim(),
      label: newFieldLabel.trim() || newFieldKey.trim(),
      type: newFieldType,
      required: false,
      ...(newFieldType === 'select' ? { options: [{ value: '', label: '' }] } : {}),
    }];
    updateSchema(newFields);
    setExpanded(prev => ({ ...prev, [newFieldKey.trim()]: true }));
    setNewFieldKey('');
    setNewFieldLabel('');
    setNewFieldType('text');
  }, [fields, newFieldKey, newFieldLabel, newFieldType, updateSchema]);

  const addOption = useCallback((fieldIndex: number) => {
    const field = fields[fieldIndex];
    if (field.type !== 'select') return;
    const newOptions = [...(field.options || []), { value: '', label: '' }];
    updateField(fieldIndex, { options: newOptions });
  }, [fields, updateField]);

  const updateOption = useCallback((fieldIndex: number, optIndex: number, updates: Partial<{ value: string; label: string }>) => {
    const field = fields[fieldIndex];
    const newOptions = (field.options || []).map((opt, i) =>
      i === optIndex ? { ...opt, ...updates } : opt
    );
    updateField(fieldIndex, { options: newOptions });
  }, [fields, updateField]);

  const removeOption = useCallback((fieldIndex: number, optIndex: number) => {
    const field = fields[fieldIndex];
    const newOptions = (field.options || []).filter((_, i) => i !== optIndex);
    updateField(fieldIndex, { options: newOptions });
  }, [fields, updateField]);

  return (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">schema</span>
          Campos do Formulário de Lead
        </h3>
        <button
          onClick={onSwitchToCode}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-lg"
        >
          <span className="material-symbols-outlined text-sm">code</span>
          Ver Código
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {fields.length === 0 && (
          <div className="text-center py-10 text-on-surface-variant/60">
            <span className="material-symbols-outlined text-3xl mb-2">playlist_add</span>
            <p className="text-sm">Nenhum campo definido.</p>
            <p className="text-xs mt-1">Adicione campos abaixo para personalizar o formulário de criação de leads.</p>
          </div>
        )}

        {fields.map((field, index) => {
          const isExpanded = expanded[field.key] !== false;
          const typeLabel = FIELD_TYPES.find(t => t.value === field.type)?.label || field.type;

          return (
            <div
              key={`${field.key}-${index}`}
              className="bg-surface-container-lowest border border-border-low-contrast rounded-xl overflow-hidden shadow-sm"
            >
              {/* Card Header */}
              <button
                type="button"
                onClick={() => toggleExpand(field.key)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-colors cursor-pointer border-none bg-transparent text-left"
              >
                <GripVertical size={16} className="text-on-surface-variant/40 flex-shrink-0" />
                <span className="flex-1 font-semibold text-sm text-on-surface truncate">
                  {field.label || field.key}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-primary font-bold bg-primary/5 px-2 py-0.5 rounded-full">
                  {typeLabel}
                </span>
                <span className="text-[10px] text-on-surface-variant/60 font-mono">{field.key}</span>
                {isExpanded ? <ChevronDown size={16} className="text-on-surface-variant/40" /> : <ChevronRight size={16} className="text-on-surface-variant/40" />}
              </button>

              {/* Card Body */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-border-low-contrast/50 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Nome do campo</label>
                      <input
                        type="text"
                        value={field.key}
                        onChange={e => updateField(index, { key: e.target.value })}
                        className="w-full bg-surface-container border border-border-low-contrast/50 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="ex: email"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Rótulo</label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={e => updateField(index, { label: e.target.value })}
                        className="w-full bg-surface-container border border-border-low-contrast/50 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="ex: E-mail"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Tipo</label>
                      <select
                        value={field.type}
                        onChange={e => {
                          const newType = e.target.value;
                          const updates: Partial<SchemaField> = { type: newType };
                          if (newType === 'select' && !field.options) {
                            updates.options = [{ value: '', label: '' }];
                          }
                          if (newType !== 'select') {
                            updates.options = undefined;
                          }
                          updateField(index, updates);
                        }}
                        className="w-full bg-surface-container border border-border-low-contrast/50 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {FIELD_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={e => updateField(index, { required: e.target.checked })}
                          className="w-4 h-4 rounded border-border-low-contrast text-primary focus:ring-primary/30"
                        />
                        <span className="text-xs font-semibold text-on-surface-variant">Obrigatório</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Placeholder (opcional)</label>
                    <input
                      type="text"
                      value={field.placeholder || ''}
                      onChange={e => updateField(index, { placeholder: e.target.value })}
                      className="w-full bg-surface-container border border-border-low-contrast/50 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Texto de exemplo..."
                    />
                  </div>

                  {/* Options section for select type */}
                  {field.type === 'select' && (
                    <div className="bg-surface-container/50 rounded-lg p-3 border border-border-low-contrast/30">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">
                        Opções
                      </label>
                      <div className="space-y-2">
                        {(field.options || []).map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={opt.value}
                              onChange={e => updateOption(index, optIndex, { value: e.target.value })}
                              placeholder="Valor"
                              className="flex-1 bg-surface-container-lowest border border-border-low-contrast/50 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <span className="text-on-surface-variant/40 text-xs">→</span>
                            <input
                              type="text"
                              value={opt.label}
                              onChange={e => updateOption(index, optIndex, { label: e.target.value })}
                              placeholder="Rótulo"
                              className="flex-[2] bg-surface-container-lowest border border-border-low-contrast/50 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <button
                              type="button"
                              onClick={() => removeOption(index, optIndex)}
                              className="p-1 hover:bg-status-critical/10 rounded-lg text-on-surface-variant/40 hover:text-status-critical transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => addOption(index)}
                        className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        <Plus size={14} />
                        Adicionar Opção
                      </button>
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t border-border-low-contrast/30">
                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      className="flex items-center gap-1 text-xs font-semibold text-status-critical hover:bg-status-critical/5 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                      Remover Campo
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add New Field Form */}
      <div className="bg-surface-container-lowest border-2 border-dashed border-border-low-contrast rounded-xl p-4">
        <h4 className="text-xs font-bold text-on-surface-variant mb-3 flex items-center gap-1.5">
          <Plus size={14} />
          Novo Campo
        </h4>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              value={newFieldKey}
              onChange={e => setNewFieldKey(e.target.value)}
              placeholder="Nome (ex: email)"
              className="bg-surface-container border border-border-low-contrast/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            <input
              type="text"
              value={newFieldLabel}
              onChange={e => setNewFieldLabel(e.target.value)}
              placeholder="Rótulo (ex: E-mail)"
              className="bg-surface-container border border-border-low-contrast/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            <select
              value={newFieldType}
              onChange={e => setNewFieldType(e.target.value)}
              className="bg-surface-container border border-border-low-contrast/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              {FIELD_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={addField}
            disabled={!newFieldKey.trim()}
            className="self-start flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Adicionar Campo
          </button>
        </div>
      </div>
    </div>
  );
};
