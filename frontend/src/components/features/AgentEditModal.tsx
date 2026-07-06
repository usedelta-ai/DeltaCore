import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { EditorWrapper } from '../ui/EditorWrapper';
import type { Empresa } from '../../services/api';

interface CursorState {
  cursor: { lineNumber: number; column: number } | null;
  scrollTop: number | null;
}

interface TabConfig {
  key: string;
  label: string;
  language: string;
  dataKey: string;
  enabled: boolean;
}

interface AgentFormData {
  name: string;
  phone_number: string;
  instance_name: string;
  status: number;
  empresa_id: number;
  upsert_lead: boolean;
  prompt: string;
  translations: string;
  search: boolean;
  search_itens: string;
  search_filters: string;
  search_schema: string;
  validate: boolean;
  validate_itens: string;
  validate_filters: string;
  validate_schema: string;
}

interface AgentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData: Partial<AgentFormData> | null;
  empresas: Empresa[];
  evolutionInstances: any[];
  isSuperAdmin: boolean;
  editingId: number | null;
}

function serializeJSON(obj: any, fallback: string): string {
  if (!obj) return fallback;
  if (typeof obj === 'string') {
    try { return JSON.stringify(JSON.parse(obj), null, 2); }
    catch { return obj; }
  }
  try { return JSON.stringify(obj, null, 2); }
  catch { return fallback; }
}

function extractField(data: any, path: string): string {
  if (!data) return '{}';
  const parts = path.split('.');
  let val: any = data;
  for (const p of parts) {
    if (val == null || typeof val !== 'object') return '{}';
    val = val[p];
  }
  return serializeJSON(val, '{}');
}

function buildInitialFormData(data: any, defaultEmpresaId: number): AgentFormData {
  const sd = data?.search_data;
  const vd = data?.validate_data;

  return {
    name: data?.name || '',
    phone_number: data?.phone_number || '',
    instance_name: data?.instance_name || '',
    status: data?.status ?? 1,
    empresa_id: data?.empresa_id ?? defaultEmpresaId,
    upsert_lead: data?.upsert_lead ?? true,
    prompt: data?.prompt || '',
    translations: serializeJSON(data?.translations, '{}'),
    search: data?.search ?? false,
    search_itens: extractField(sd, 'itens'),
    search_filters: extractField(sd, 'filters'),
    search_schema: extractField(sd, 'schema'),
    validate: data?.validate ?? false,
    validate_itens: extractField(vd, 'itens'),
    validate_filters: extractField(vd, 'filters'),
    validate_schema: extractField(vd, 'schema'),
  };
}

export const AgentEditModal: React.FC<AgentEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  empresas,
  evolutionInstances,
  isSuperAdmin,
  editingId,
}) => {
  const [formData, setFormData] = useState<AgentFormData>(() =>
    buildInitialFormData(initialData, empresas[0]?.id || 0)
  );
  const [activeTab, setActiveTab] = useState('prompt');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorInstanceRef = useRef<any>(null);
  const savedPositions = useRef<Record<string, CursorState>>({});
  const prevOpenRef = useRef(false);

  useEffect(() => {
    const justOpened = isOpen && !prevOpenRef.current;
    prevOpenRef.current = isOpen;

    if (justOpened) {
      setFormData(buildInitialFormData(initialData, empresas[0]?.id || 0));
      setActiveTab('prompt');
      savedPositions.current = {};
    }
  }, [isOpen, initialData, editingId, empresas]);

  const tabs: TabConfig[] = useMemo(() => [
    { key: 'prompt', label: 'Prompt', language: 'plaintext', dataKey: 'prompt', enabled: true },
    { key: 'translations', label: 'Traduções', language: 'json', dataKey: 'translations', enabled: true },
    { key: 'search_itens', label: 'Search - Itens', language: 'json', dataKey: 'search_itens', enabled: formData.search },
    { key: 'search_filters', label: 'Search - Filtros', language: 'json', dataKey: 'search_filters', enabled: formData.search },
    { key: 'search_schema', label: 'Search - Schema', language: 'json', dataKey: 'search_schema', enabled: formData.search },
    { key: 'validate_itens', label: 'Validate - Itens', language: 'json', dataKey: 'validate_itens', enabled: formData.validate },
    { key: 'validate_filters', label: 'Validate - Filtros', language: 'json', dataKey: 'validate_filters', enabled: formData.validate },
    { key: 'validate_schema', label: 'Validate - Schema', language: 'json', dataKey: 'validate_schema', enabled: formData.validate },
  ], [formData.search, formData.validate]);

  const activeTabConfig = tabs.find(t => t.key === activeTab) || tabs[0];

  if (!activeTabConfig.enabled) {
    const firstEnabled = tabs.find(t => t.enabled);
    if (firstEnabled && activeTab !== firstEnabled.key) {
      setActiveTab(firstEnabled.key);
    }
  }

  const getEditorValue = useCallback(() => {
    return formData[activeTabConfig.dataKey as keyof AgentFormData] as string || '';
  }, [formData, activeTabConfig.dataKey]);

  const handleEditorChange = useCallback((val: string) => {
    setFormData(prev => ({ ...prev, [activeTabConfig.dataKey as keyof AgentFormData]: val }));
  }, [activeTabConfig.dataKey]);

  const handleEditorMount = useCallback((editor: any) => {
    editorInstanceRef.current = editor;
  }, []);

  const handleCursorChange = useCallback((cursor: { lineNumber: number; column: number } | null) => {
    savedPositions.current[activeTab] = {
      ...savedPositions.current[activeTab],
      cursor,
    };
  }, [activeTab]);

  const handleScrollChange = useCallback((scrollTop: number) => {
    savedPositions.current[activeTab] = {
      ...savedPositions.current[activeTab],
      scrollTop,
    };
  }, [activeTab]);

  const handleTabSwitch = useCallback((tabKey: string) => {
    const editor = editorInstanceRef.current;
    if (editor) {
      savedPositions.current[activeTab] = {
        cursor: editor.getPosition(),
        scrollTop: editor.getScrollTop(),
      };
    }
    setActiveTab(tabKey);
  }, [activeTab]);

  const updateField = useCallback(<K extends keyof AgentFormData>(key: K, value: AgentFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setActionLoading(true);
    setError(null);

    try {
      const parseField = (val: string) => {
        try { return JSON.parse(val); }
        catch { return val; }
      };

      const payload = {
        name: formData.name,
        prompt: formData.prompt,
        phone_number: formData.phone_number,
        instance_name: formData.instance_name,
        status: formData.status,
        empresa_id: formData.empresa_id,
        upsert_lead: formData.upsert_lead,
        translations: parseField(formData.translations),
        search: formData.search,
        search_data: {
          itens: parseField(formData.search_itens),
          filters: parseField(formData.search_filters),
          schema: parseField(formData.search_schema),
        },
        validate: formData.validate,
        validate_data: {
          itens: parseField(formData.validate_itens),
          filters: parseField(formData.validate_filters),
          schema: parseField(formData.validate_schema),
        },
      };

      await onSave(payload);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setActionLoading(false);
    }
  }, [formData, onSave]);

  if (!isOpen) return null;

  const cursorPos = savedPositions.current[activeTab]?.cursor || null;
  const scrollPos = savedPositions.current[activeTab]?.scrollTop ?? null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(9, 10, 12, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        width: '100%', height: '95vh',
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--card-border))',
        borderRadius: '20px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 24px',
          borderBottom: '1px solid hsl(var(--card-border))',
          flexShrink: 0,
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
            {editingId ? 'Editar Agente' : 'Novo Agente'}
          </h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {error && (
              <span style={{ color: '#ef4444', fontSize: '13px' }}>{error}</span>
            )}
            <button onClick={onClose} className="btn-ghost" style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '18px',
              color: 'hsl(var(--muted-foreground))', background: 'transparent',
            }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel - Editor */}
          <div style={{
            flex: '1 1 0',
            display: 'flex', flexDirection: 'column',
            borderRight: '1px solid hsl(var(--card-border))',
            minWidth: 0,
          }}>
            {/* Tab Bar */}
            <div style={{
              display: 'flex', gap: '2px',
              padding: '8px 12px 0',
              background: 'hsl(var(--background))',
              borderBottom: '1px solid hsl(var(--card-border))',
              overflowX: 'auto',
              flexShrink: 0,
            }}>
              {tabs.map(tab => {
                const isActive = activeTab === tab.key;
                const isEnabled = tab.enabled;
                return (
                  <button
                    key={tab.key}
                    disabled={!isEnabled}
                    onClick={() => handleTabSwitch(tab.key)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: isActive ? 600 : 400,
                      border: 'none',
                      background: isActive ? 'hsl(var(--card))' : 'transparent',
                      color: isEnabled
                        ? isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'
                        : 'hsl(var(--muted-foreground) / 0.4)',
                      cursor: isEnabled ? 'pointer' : 'not-allowed',
                      borderTopLeftRadius: '6px',
                      borderTopRightRadius: '6px',
                      borderBottom: isActive ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                      opacity: isEnabled ? 1 : 0.4,
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Editor Area */}
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <EditorWrapper
                key={`${activeTab}-${editingId ?? 'new'}`}
                itemKey={`${activeTab}-${editingId ?? 'new'}`}
                initialValue={getEditorValue()}
                onChange={handleEditorChange}
                language={activeTabConfig.language}
                cursorPosition={cursorPos}
                scrollPosition={scrollPos}
                onMount={handleEditorMount}
                onCursorChange={handleCursorChange}
                onScrollChange={handleScrollChange}
              />
            </div>
          </div>

          {/* Right Panel - Form Fields */}
          <div style={{
            width: '280px', flexShrink: 0,
            display: 'flex', flexDirection: 'column',
            background: 'hsl(var(--background))',
          }}>
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Nome</label>
                  <input type="text" className="form-control" value={formData.name}
                    onChange={e => updateField('name', e.target.value)} required />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Telefone</label>
                  <input type="text" className="form-control" value={formData.phone_number}
                    onChange={e => updateField('phone_number', e.target.value)} />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Instância</label>
                  <select className="form-control" value={formData.instance_name}
                    onChange={e => updateField('instance_name', e.target.value)}>
                    <option value="">Selecione...</option>
                    {evolutionInstances.map((inst: any) => (
                      <option key={inst.instanceName || inst.name} value={inst.instanceName || inst.name}>
                        {inst.instanceName || inst.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Status</label>
                  <select className="form-control" value={formData.status}
                    onChange={e => updateField('status', Number(e.target.value))}>
                    <option value={1}>Ativo</option>
                    <option value={2}>Pendente</option>
                  </select>
                </div>

                {isSuperAdmin && (
                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Empresa</label>
                    <select className="form-control" value={formData.empresa_id}
                      onChange={e => updateField('empresa_id', Number(e.target.value))}>
                      {empresas.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ borderTop: '1px solid hsl(var(--card-border))', marginTop: '4px', paddingTop: '12px' }}>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginBottom: '8px'
                  }}>
                    <input type="checkbox" checked={formData.upsert_lead}
                      onChange={e => updateField('upsert_lead', e.target.checked)} />
                    Upsert Lead
                  </label>

                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginBottom: '8px'
                  }}>
                    <input type="checkbox" checked={formData.search}
                      onChange={e => {
                        updateField('search', e.target.checked);
                        if (!e.target.checked && activeTab.startsWith('search_')) {
                          setActiveTab('prompt');
                        }
                      }} />
                    Search (Ativar)
                  </label>

                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                  }}>
                    <input type="checkbox" checked={formData.validate}
                      onChange={e => {
                        updateField('validate', e.target.checked);
                        if (!e.target.checked && activeTab.startsWith('validate_')) {
                          setActiveTab('prompt');
                        }
                      }} />
                    Validate (Ativar)
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              borderTop: '1px solid hsl(var(--card-border))',
              padding: '16px',
              display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleSave}
                disabled={actionLoading}
              >
                {actionLoading ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={onClose}
                disabled={actionLoading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
