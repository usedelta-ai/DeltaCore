import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { EditorWrapper } from '../ui/EditorWrapper';
import { Avatar } from '../ui/Avatar';
import { SchemaVisualEditor } from './SchemaVisualEditor';
import type { Empresa } from '../../services/api';

interface CursorState {
  cursor: { lineNumber: number; column: number } | null;
  scrollTop: number | null;
}

interface EditorInstance {
  getPosition: () => { lineNumber: number; column: number } | null;
  setPosition: (pos: { lineNumber: number; column: number }) => void;
  revealPositionInCenter: (pos: { lineNumber: number; column: number }) => void;
  getScrollTop: () => number;
  setScrollTop: (top: number) => void;
  onDidChangeCursorPosition: (cb: (e: { position: { lineNumber: number; column: number } }) => void) => void;
  onDidScrollChange: (cb: (e: { scrollTop: number }) => void) => void;
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
  custom_properties_schema: string;
}

interface AgentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  initialData: Partial<AgentFormData> | null;
  empresas: Empresa[];
  evolutionInstances: Record<string, string>[];
  isSuperAdmin: boolean;
  editingId: number | null;
}

function serializeJSON(obj: unknown, fallback: string): string {
  if (!obj) return fallback;
  if (typeof obj === 'string') {
    try { return JSON.stringify(JSON.parse(obj), null, 2); }
    catch { return obj; }
  }
  try { return JSON.stringify(obj, null, 2); }
  catch { return fallback; }
}

function extractField(data: unknown, path: string): string {
  if (!data) return '{}';
  const parts = path.split('.');
  let val: unknown = data;
  for (const p of parts) {
    if (val == null || typeof val !== 'object') return '{}';
    val = (val as Record<string, unknown>)[p];
  }
  return serializeJSON(val, '{}');
}

function buildInitialFormData(data: unknown, defaultEmpresaId: number): AgentFormData {
  const d = data as Record<string, unknown> | null;
  const sd = d?.search_data;
  const vd = d?.validate_data;

  return {
    name: (d?.name as string) || '',
    phone_number: (d?.phone_number as string) || '',
    instance_name: (d?.instance_name as string) || '',
    status: (d?.status as number) ?? 1,
    empresa_id: (d?.empresa_id as number) ?? defaultEmpresaId,
    upsert_lead: (d?.upsert_lead as boolean) ?? true,
    prompt: (d?.prompt as string) || '',
    translations: serializeJSON(d?.translations, '{}'),
    search: (d?.search as boolean) ?? false,
    search_itens: extractField(sd, 'itens'),
    search_filters: extractField(sd, 'filters'),
    search_schema: extractField(sd, 'schema'),
    validate: (d?.validate as boolean) ?? false,
    validate_itens: extractField(vd, 'itens'),
    validate_filters: extractField(vd, 'filters'),
    validate_schema: extractField(vd, 'schema'),
    custom_properties_schema: serializeJSON(d?.custom_properties_schema, '{"fields":[]}'),
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
  const [schemaViewMode, setSchemaViewMode] = useState<'visual' | 'code'>('visual');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCursorPos, setSavedCursorPos] = useState<CursorState['cursor']>(null);
  const [savedScrollPos, setSavedScrollPos] = useState<CursorState['scrollTop']>(null);
  const editorInstanceRef = useRef<EditorInstance>(null);
  const savedPositions = useRef<Record<string, CursorState>>({});
  const prevOpenRef = useRef(false);

  const currentEmpresa = useMemo(() => {
    return empresas.find(e => e.id === formData.empresa_id);
  }, [formData.empresa_id, empresas]);

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
    { key: 'prompt', label: 'Prompt Principal', language: 'plaintext', dataKey: 'prompt', enabled: true },
    { key: 'translations', label: 'Traduções', language: 'json', dataKey: 'translations', enabled: true },
    { key: 'custom_properties_schema', label: 'Schema de Lead', language: 'json', dataKey: 'custom_properties_schema', enabled: true },
    { key: 'search_itens', label: 'Busca Semântica', language: 'json', dataKey: 'search_itens', enabled: formData.search },
    { key: 'search_filters', label: 'Busca - Filtros', language: 'json', dataKey: 'search_filters', enabled: formData.search },
    { key: 'search_schema', label: 'Busca - Schema', language: 'json', dataKey: 'search_schema', enabled: formData.search },
    { key: 'validate_itens', label: 'Regras Globais', language: 'json', dataKey: 'validate_itens', enabled: formData.validate },
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

  const handleEditorMount = useCallback((editor: EditorInstance) => {
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
    const next = savedPositions.current[tabKey];
    setSavedCursorPos(next?.cursor || null);
    setSavedScrollPos(next?.scrollTop ?? null);
    setActiveTab(tabKey);
    if (tabKey === 'custom_properties_schema') {
      setSchemaViewMode('visual');
    }
  }, [activeTab]);

  useEffect(() => {
    const pos = savedPositions.current[activeTab];
    setSavedCursorPos(pos?.cursor || null);
    setSavedScrollPos(pos?.scrollTop ?? null);
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
        custom_properties_schema: parseField(formData.custom_properties_schema),
      };

      await onSave(payload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setActionLoading(false);
    }
  }, [formData, onSave]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-surface-container-lowest w-full max-w-[95vw] h-[95vh] rounded-[1.5rem] shadow-2xl flex flex-col overflow-hidden border border-outline-variant/30">
        {/* HEADER */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-outline-variant/50 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
              <span className="material-symbols-outlined">edit</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-headline leading-tight">
                {editingId ? 'Editar Agente' : 'Novo Agente'}
              </h2>
              <p className="text-sm text-on-surface-variant">
                {editingId ? `ID: AG-${String(editingId).padStart(5, '0')}` : 'Novo agente'}
                {currentEmpresa ? ` • ${currentEmpresa.name}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {error && (
              <span className="text-status-critical text-sm">{error}</span>
            )}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors group"
            >
              <span className="material-symbols-outlined text-on-surface-variant group-hover:rotate-90 transition-transform">close</span>
            </button>
          </div>
        </header>

        {/* BODY */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT SIDE: EDITOR AREA */}
          <section className="flex-1 flex flex-col bg-surface border-r border-outline-variant/50 min-w-0">
            {/* Editor Tabs */}
            <div className="flex gap-1 px-4 pt-4 overflow-x-auto flex-shrink-0 scrollbar-hide">
              {tabs.map(tab => {
                const isActive = activeTab === tab.key;
                const isEnabled = tab.enabled;
                return (
                  <button
                    key={tab.key}
                    disabled={!isEnabled}
                    onClick={() => handleTabSwitch(tab.key)}
                    className={`px-6 py-2.5 rounded-t-xl text-sm whitespace-nowrap transition-all ${
                      !isEnabled
                        ? 'text-outline/40 cursor-not-allowed'
                        : isActive
                          ? 'bg-surface-container-lowest border-x border-t border-outline-variant text-primary font-semibold'
                          : 'text-on-surface-variant font-medium hover:bg-surface-container'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Schema Visual Editor or Code Editor */}
            {activeTab === 'custom_properties_schema' && schemaViewMode === 'visual' ? (
              <SchemaVisualEditor
                value={formData.custom_properties_schema}
                onChange={(val) => setFormData(prev => ({ ...prev, custom_properties_schema: val }))}
                onSwitchToCode={() => setSchemaViewMode('code')}
              />
            ) : (
              <div className="flex-1 bg-surface-container-lowest mx-4 mb-6 rounded-b-xl border border-outline-variant flex flex-col shadow-sm min-h-0">
                <div className="bg-surface-container-low px-4 py-2 border-b border-outline-variant flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-error/40" />
                    <span className="w-3 h-3 rounded-full bg-secondary-fixed/40" />
                    <span className="w-3 h-3 rounded-full bg-status-success/40" />
                    <span className="ml-4 text-[10px] font-mono text-outline uppercase tracking-widest">
                      {activeTabConfig.label.replace(/\s/g, '_')}.{activeTabConfig.language === 'json' ? 'json' : 'xml'}
                    </span>
                  </div>
                  {activeTab === 'custom_properties_schema' && (
                    <button
                      onClick={() => setSchemaViewMode('visual')}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <span className="material-symbols-outlined text-sm">view_quilt</span>
                      Editor Visual
                    </button>
                  )}
                </div>
                <div className="flex-1 min-h-0">
                  <EditorWrapper
                    key={`${activeTab}-${editingId ?? 'new'}`}
                    itemKey={`${activeTab}-${editingId ?? 'new'}`}
                    initialValue={getEditorValue()}
                    onChange={handleEditorChange}
                    language={activeTabConfig.language}
                    cursorPosition={savedCursorPos}
                    scrollPosition={savedScrollPos}
                    onMount={handleEditorMount}
                    onCursorChange={handleCursorChange}
                    onScrollChange={handleScrollChange}
                  />
                </div>
              </div>
            )}
          </section>

          {/* RIGHT SIDE: SETTINGS */}
          <aside className="w-[380px] p-8 flex flex-col gap-6 overflow-y-auto bg-surface-container-lowest flex-shrink-0 custom-scrollbar">
            <h3 className="font-headline font-semibold text-sm uppercase tracking-wider text-outline">Configurações Base</h3>

            <div className="space-y-4">
              {/* Nome */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-2">
                  Nome do Agente
                  <span className="material-symbols-outlined text-[14px]">info</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => updateField('name', e.target.value)}
                  className="w-full bg-surface-container px-4 py-2.5 rounded-lg border-none focus:ring-2 focus:ring-primary-container text-sm font-medium"
                  placeholder="Ex: Assistente de Reservas"
                />
              </div>

              {/* WhatsApp */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">WhatsApp Vinculado</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={e => updateField('phone_number', e.target.value)}
                    className="w-full bg-surface-container pl-10 pr-4 py-2.5 rounded-lg border-none focus:ring-2 focus:ring-primary-container text-sm font-medium"
                    placeholder="+55 (47) 99999-9999"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">call</span>
                </div>
              </div>

              {/* Grid Dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Instância</label>
                  <select
                    value={formData.instance_name}
                    onChange={e => updateField('instance_name', e.target.value)}
                    className="w-full bg-surface-container px-3 py-2.5 rounded-lg border-none text-sm focus:ring-2 focus:ring-primary-container"
                  >
                    <option value="">Selecione...</option>
                    {evolutionInstances.map((inst: Record<string, string>) => (
                      <option key={inst.instanceName || inst.name} value={inst.instanceName || inst.name}>
                        {inst.instanceName || inst.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Status</label>
                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={e => updateField('status', Number(e.target.value))}
                      className={`w-full px-3 py-2.5 rounded-lg border-none text-sm font-bold appearance-none focus:ring-2 focus:ring-primary-container ${
                        formData.status === 1
                          ? 'bg-status-success/10 text-status-success'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      <option value={1}>Ativo</option>
                      <option value={2}>Pendente</option>
                      <option value={0}>Inativo</option>
                    </select>
                    {formData.status === 1 && (
                      <span className="w-2 h-2 bg-status-success rounded-full absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                </div>
              </div>

              {/* Empresa */}
              {isSuperAdmin && (
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-on-surface-variant">Empresa Vinculada</label>
                  <div className="flex items-center gap-3 bg-surface-container p-2 rounded-lg">
                    <div className="w-8 h-8 rounded-md overflow-hidden bg-white flex-shrink-0">
                      {currentEmpresa?.logo ? (
                        <Avatar src={currentEmpresa.logo} name={currentEmpresa.name} size="md" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container-high">
                          <span className="material-symbols-outlined text-outline text-sm">business</span>
                        </div>
                      )}
                    </div>
                    <select
                      value={formData.empresa_id}
                      onChange={e => updateField('empresa_id', Number(e.target.value))}
                      className="flex-1 text-sm font-medium bg-transparent border-none focus:ring-0 cursor-pointer"
                    >
                      {empresas.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined text-outline">swap_horiz</span>
                  </div>
                </div>
              )}
            </div>

            <div className="h-px bg-outline-variant/30 my-2" />

            <h3 className="font-headline font-semibold text-sm uppercase tracking-wider text-outline">Permissões e Ações</h3>

            <div className="space-y-3">
              {/* Upsert Lead */}
              <label className="flex items-center gap-3 p-3 bg-surface hover:bg-surface-container rounded-xl cursor-pointer transition-all border border-transparent hover:border-outline-variant/50 group">
                <input
                  type="checkbox"
                  checked={formData.upsert_lead}
                  onChange={e => updateField('upsert_lead', e.target.checked)}
                  className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary-container"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Upsert Lead</span>
                  <span className="text-[10px] text-outline">Cria/Atualiza contatos no CRM automaticamente</span>
                </div>
                <span className="material-symbols-outlined ml-auto text-outline group-hover:text-primary text-lg">database</span>
              </label>

              {/* Knowledge Search */}
              <label className="flex items-center gap-3 p-3 bg-surface hover:bg-surface-container rounded-xl cursor-pointer transition-all border border-transparent hover:border-outline-variant/50 group">
                <input
                  type="checkbox"
                  checked={formData.search}
                  onChange={e => {
                    updateField('search', e.target.checked);
                    if (!e.target.checked && activeTab.startsWith('search_')) {
                      setActiveTab('prompt');
                    }
                  }}
                  className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary-container"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Knowledge Search</span>
                  <span className="text-[10px] text-outline">Consulta base de documentos técnica</span>
                </div>
                <span className="material-symbols-outlined ml-auto text-outline group-hover:text-primary text-lg">search_insights</span>
              </label>

              {/* Validate Document */}
              <label className="flex items-center gap-3 p-3 bg-surface hover:bg-surface-container rounded-xl cursor-pointer transition-all border border-transparent hover:border-outline-variant/50 group">
                <input
                  type="checkbox"
                  checked={formData.validate}
                  onChange={e => {
                    updateField('validate', e.target.checked);
                    if (!e.target.checked && activeTab.startsWith('validate_')) {
                      setActiveTab('prompt');
                    }
                  }}
                  className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary-container"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Validate Document</span>
                  <span className="text-[10px] text-outline">OCR e validação de identidades (RG/CPF)</span>
                </div>
                <span className="material-symbols-outlined ml-auto text-outline group-hover:text-primary text-lg">verified_user</span>
              </label>
            </div>
          </aside>
        </div>

        {/* FOOTER */}
        <footer className="h-24 bg-surface-container-low px-8 flex items-center justify-between border-t border-outline-variant/50 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-surface-container-low overflow-hidden bg-primary flex items-center justify-center text-white text-[10px] font-bold">
                AK
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-primary text-[10px] flex items-center justify-center text-white font-bold">
                +3
              </div>
            </div>
            <span className="text-xs text-on-surface-variant font-medium">
              Editado por última vez por <strong>Admin</strong>
            </span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              disabled={actionLoading}
              className="px-8 py-3 rounded-xl border border-outline-variant font-semibold text-on-surface hover:bg-surface-container-highest transition-all duration-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={actionLoading}
              className="px-10 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
              {actionLoading ? 'Salvando...' : 'Salvar Agente'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
