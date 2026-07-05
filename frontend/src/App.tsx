import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2, Users, ClipboardList,
  MessageSquare, Plus, Pencil, Trash2, X,
  FolderOpen, AlertCircle, UserCheck, Menu, Search
} from 'lucide-react';
import { api, getBoardUrl } from './services/api';
import type { Empresa, Agent, FollowUpSetting, Lead, ChatMessage } from './services/api';
import { ConfirmationModal } from './components/Modal';
import { Badge } from './components/atoms/Badge';
import { EditorWrapper } from './components/atoms/EditorWrapper';
import { ToolResultCollapsible } from './components/molecules/ToolResultCollapsible';
import { SkeletonView } from './components/molecules/SkeletonView';
import { MediaMessageRenderer } from './components/organisms/MediaMessageRenderer';
import { LoginMock } from './components/organisms/LoginMock';

import { useAuthMock } from './hooks/useAuthMock';
import { useEmpresas } from './hooks/useEmpresas';
import { useAgents } from './hooks/useAgents';
import { useLeads } from './hooks/useLeads';
import { useFollowUps } from './hooks/useFollowUps';

type Tab = 'empresas' | 'agents' | 'follow-ups' | 'leads' | 'messages';

export default function App() {
  const { role, companyId, isSuperAdmin, isManager, isEmployee, hasWritePermission } = useAuthMock();

  const { empresas, loading: loadingEmp, createEmpresa, updateEmpresa, deleteEmpresa } = useEmpresas();
  const { agents, loading: loadingAg, createAgent, updateAgent, deleteAgent } = useAgents();
  const { leads, loading: loadingLd, createLead, updateLead, deleteLead, refetch: refetchLeads } = useLeads();
  const { followUps, loading: loadingFl, createFollowUp, updateFollowUp, deleteFollowUp } = useFollowUps();

  const getTabFromHash = (): Tab => {
    const hash = window.location.hash.replace('#', '');
    const tabPart = hash.split('?')[0];
    const validTabs: Tab[] = ['empresas', 'agents', 'follow-ups', 'leads', 'messages'];
    if (validTabs.includes(tabPart as Tab)) {
      return tabPart as Tab;
    }
    return 'empresas';
  };

  const [activeTab, setActiveTab] = useState<Tab>(getTabFromHash);
  const [showInactive, setShowInactive] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forms fields
  const [empresaName, setEmpresaName] = useState('');
  const [empresaLogo, setEmpresaLogo] = useState<string | null>(null);

  const [agentName, setAgentName] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentInstance, setAgentInstance] = useState('');
  const [agentStatus, setAgentStatus] = useState<number>(1);
  const [agentEmpresaId, setAgentEmpresaId] = useState<number>(0);
  const [agentUpsertLead, setAgentUpsertLead] = useState(true);
  const [agentTranslations, setAgentTranslations] = useState('{}');
  const [agentSearch, setAgentSearch] = useState(false);
  const [agentSearchData, setAgentSearchData] = useState('{\n  "itens": [],\n  "filters": {},\n  "schema": {}\n}');
  const [agentValidate, setAgentValidate] = useState(false);
  const [agentValidateData, setAgentValidateData] = useState('{\n  "itens": [],\n  "filters": {},\n  "schema": {}\n}');
  const [agentActiveSubtab, setAgentActiveSubtab] = useState<'prompt' | 'translations' | 'search' | 'validate'>('prompt');

  const [followOrder, setFollowOrder] = useState<number>(1);
  const [followMessage, setFollowMessage] = useState('');
  const [followTime, setFollowTime] = useState<number>(60);
  const [followAgentId, setFollowAgentId] = useState<number>(0);
  const [followActive, setFollowActive] = useState(true);

  const [leadAgentId, setLeadAgentId] = useState<number>(0);
  const [leadRemoteJid, setLeadRemoteJid] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadStatus, setLeadStatus] = useState('NOVO');
  const [leadValue, setLeadValue] = useState<string>('');
  const [leadTakenMotive, setLeadTakenMotive] = useState('');
  const [leadFollowUpId, setLeadFollowUpId] = useState<number | null>(null);
  const [leadSessionId, setLeadSessionId] = useState('');
  const [leadCustomProperties, setLeadCustomProperties] = useState('{}');

  const [filterEmpresaId, setFilterEmpresaId] = useState<number | string>('');
  const [filterAgentId, setFilterAgentId] = useState<number | string>('');

  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [historySource, setHistorySource] = useState<string>('');
  const [historyTable, setHistoryTable] = useState<string>('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [liveMonitoring, setLiveMonitoring] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [expandedAgents, setExpandedAgents] = useState<Record<string, boolean>>({});
  const [isMainSidebarCollapsed, setIsMainSidebarCollapsed] = useState(() => getTabFromHash() === 'messages');

  const chatContainerRef = React.useRef<HTMLDivElement | null>(null);

  const [evolutionInstances, setEvolutionInstances] = useState<any[]>([]);
  const [qrModal, setQrModal] = useState<{
    isOpen: boolean;
    instanceName: string;
    qrCode: string | null;
    loading: boolean;
    error: string | null;
  }>({ isOpen: false, instanceName: '', qrCode: null, loading: false, error: null });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: number;
    type: Tab;
    name: string;
  }>({ isOpen: false, id: 0, type: 'empresas', name: '' });

  // Tenancy Filter Helpers
  const filterByCompany = <T extends { empresa_id?: number }>(items: T[]): T[] => {
    if (isSuperAdmin) return items;
    return items.filter(item => item.empresa_id === companyId);
  };

  const getFilteredEmpresas = () => {
    if (isSuperAdmin) return empresas;
    return empresas.filter(e => e.id === companyId);
  };

  const getFilteredAgents = () => {
    return filterByCompany(agents);
  };

  const getFilteredFollowUps = () => {
    return followUps.filter(f => {
      const agent = agents.find(a => a.id === f.agent_id);
      return isSuperAdmin || (agent && agent.empresa_id === companyId);
    });
  };

  const getFilteredLeads = () => {
    return leads.filter(l => {
      const agent = agents.find(a => a.id === l.agent_id);
      return isSuperAdmin || (agent && agent.empresa_id === companyId);
    });
  };

  // Groupings
  const getGroupedLeads = () => {
    const groups: Record<number, { name: string; active: boolean; agents: Record<number, { name: string; active: boolean; leads: Lead[] }> }> = {};

    getFilteredLeads().forEach(lead => {
      if (chatSearchQuery.trim()) {
        const query = chatSearchQuery.toLowerCase();
        const nameMatch = lead.name && lead.name.toLowerCase().includes(query);
        const jidMatch = lead.remote_jid_alt && lead.remote_jid_alt.toLowerCase().includes(query);
        if (!nameMatch && !jidMatch) return;
      }
      const agent = agents.find(a => a.id === lead.agent_id);
      const agentId = agent?.id || 0;
      const agentName = agent?.name || (lead as any).agent_name || 'Sem Agente';
      const agentActive = agent ? agent.status !== 0 : ((lead as any).agent_status !== 0 && (lead as any).agent_status != null);

      const empresaId = agent?.empresa_id || 0;
      const empresa = empresas.find(e => e.id === empresaId);
      const empresaName = empresa?.name || 'Sem Empresa';
      const empresaActive = empresa ? empresa.active : true;

      if (!groups[empresaId]) {
        groups[empresaId] = { name: empresaName, active: empresaActive, agents: {} };
      }
      if (!groups[empresaId].agents[agentId]) {
        groups[empresaId].agents[agentId] = { name: agentName, active: agentActive, leads: [] };
      }
      groups[empresaId].agents[agentId].leads.push(lead);
    });

    return Object.entries(groups).map(([empId, empData]) => ({
      empresaId: Number(empId),
      empresaName: empData.name,
      empresaActive: empData.active,
      agents: Object.entries(empData.agents).map(([agId, agData]) => ({
        agentId: Number(agId),
        agentName: agData.name,
        agentActive: agData.active,
        leads: agData.leads
      }))
    }));
  };

  const getGroupedAgents = () => {
    const list = getFilteredAgents();
    const visibleAgents = showInactive ? list.filter(ag => ag.status === 0) : list.filter(ag => ag.status !== 0);
    const groups: Record<number, { name: string; logo: string | null; agents: Agent[] }> = {};

    visibleAgents.forEach(ag => {
      const empresaId = ag.empresa_id || 0;
      const empresa = empresas.find(e => e.id === empresaId);
      const empresaName = empresa?.name || 'Sem Empresa';
      const empresaLogo = empresa?.logo || null;

      if (!groups[empresaId]) {
        groups[empresaId] = { name: empresaName, logo: empresaLogo, agents: [] };
      }
      groups[empresaId].agents.push(ag);
    });

    return Object.entries(groups).map(([empId, empData]) => ({
      empresaId: Number(empId),
      empresaName: empData.name,
      empresaLogo: empData.logo,
      agents: empData.agents
    }));
  };

  const getGroupedFollowUps = () => {
    const groups: Record<number, { name: string; logo: string | null; agents: Record<number, { name: string; followUps: FollowUpSetting[] }> }> = {};

    getFilteredFollowUps().forEach(fl => {
      const agent = agents.find(a => a.id === fl.agent_id);
      const agentId = agent?.id || 0;
      const agentName = agent?.name || 'Sem Agente';

      const empresaId = agent?.empresa_id || 0;
      const empresa = empresas.find(e => e.id === empresaId);
      const empresaName = empresa?.name || 'Sem Empresa';
      const empresaLogo = empresa?.logo || null;

      if (!groups[empresaId]) {
        groups[empresaId] = { name: empresaName, logo: empresaLogo, agents: {} };
      }
      if (!groups[empresaId].agents[agentId]) {
        groups[empresaId].agents[agentId] = { name: agentName, followUps: [] };
      }
      groups[empresaId].agents[agentId].followUps.push(fl);
    });

    return Object.entries(groups).map(([empId, empData]) => ({
      empresaId: Number(empId),
      empresaName: empData.name,
      empresaLogo: empData.logo,
      agents: Object.entries(empData.agents).map(([agId, agData]) => ({
        agentId: Number(agId),
        agentName: agData.name,
        followUps: agData.followUps.sort((a, b) => a.order - b.order)
      }))
    }));
  };

  useEffect(() => {
    if (activeTab === 'messages') {
      setIsMainSidebarCollapsed(true);
    } else {
      setIsMainSidebarCollapsed(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, loadingHistory, selectedLeadId]);

  useEffect(() => {
    if (activeTab === 'messages' && selectedLeadId) {
      const lead = getFilteredLeads().find(l => l.id === selectedLeadId);
      if (lead && lead.session_id) {
        window.location.hash = `#messages?session_id=${lead.session_id}`;
      }
    } else {
      window.location.hash = activeTab;
    }
  }, [activeTab, selectedLeadId]);

  // Load chat history
  useEffect(() => {
    if (activeTab === 'messages' && selectedLeadId) {
      const loadHistory = async () => {
        setLoadingHistory(true);
        try {
          const res = await api.getLeadHistory(selectedLeadId);
          setChatHistory(res.messages);
          setHistorySource(res.source);
          setHistoryTable(res.tableName || '');
        } catch (err: any) {
          setError(err.message || 'Erro ao carregar chat');
        } finally {
          setLoadingHistory(false);
        }
      };
      loadHistory();
    }
  }, [selectedLeadId, activeTab]);

  // Live monitor
  useEffect(() => {
    let ticker: any;
    if (activeTab === 'messages' && selectedLeadId && liveMonitoring) {
      ticker = setInterval(async () => {
        try {
          const historyRes = await api.getLeadHistory(selectedLeadId);
          setChatHistory(historyRes.messages);
          refetchLeads();
        } catch (_) {}
      }, 3000);
    }
    return () => clearInterval(ticker);
  }, [selectedLeadId, activeTab, liveMonitoring]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setEmpresaLogo(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchEvolutionInstances = async () => {
    try {
      const data = await api.getEvolutionInstances();
      setEvolutionInstances(Array.isArray(data) ? data : (data as any).instances || []);
    } catch (_) {}
  };

  const showEvolutionQrCode = async (instanceName: string) => {
    setQrModal({ isOpen: true, instanceName, qrCode: null, loading: true, error: null });
    try {
      const res = await api.connectEvolutionInstance(instanceName);
      const qrUrl = res.base64 || res.qrcode?.base64 || res.code;
      setQrModal(prev => ({
        ...prev,
        loading: false,
        qrCode: qrUrl?.startsWith('data:') ? qrUrl : `data:image/png;base64,${qrUrl}`
      }));
    } catch (err: any) {
      setQrModal(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  useEffect(() => {
    if (activeTab === 'agents' && isFormOpen && hasWritePermission) {
      fetchEvolutionInstances();
    }
  }, [activeTab, isFormOpen]);

  const openCreateForm = () => {
    if (!hasWritePermission) return;
    setEditingId(null);
    setError(null);

    if (activeTab === 'empresas') {
      setEmpresaName('');
      setEmpresaLogo(null);
    } else if (activeTab === 'agents') {
      setAgentName('');
      setAgentPrompt('');
      setAgentPhone('');
      setAgentInstance('');
      setAgentStatus(1);
      setAgentEmpresaId(isSuperAdmin ? empresas[0]?.id || 0 : (companyId || 0));
      setAgentUpsertLead(true);
      setAgentTranslations('{}');
      setAgentSearch(false);
      setAgentSearchData('{\n  "itens": [],\n  "filters": {},\n  "schema": {}\n}');
      setAgentValidate(false);
      setAgentValidateData('{\n  "itens": [],\n  "filters": {},\n  "schema": {}\n}');
      setAgentActiveSubtab('prompt');
    } else if (activeTab === 'follow-ups') {
      setFollowOrder(1);
      setFollowMessage('');
      setFollowTime(60);
      setFollowAgentId(getFilteredAgents()[0]?.id || 0);
      setFollowActive(true);
    } else if (activeTab === 'leads') {
      setLeadAgentId(getFilteredAgents()[0]?.id || 0);
      setLeadRemoteJid('');
      setLeadName('');
      setLeadStatus('NOVO');
      setLeadValue('');
      setLeadTakenMotive('');
      setLeadFollowUpId(null);
      setLeadSessionId('');
      setLeadCustomProperties('{}');
    }

    setIsFormOpen(true);
  };

  const openEditForm = (item: any) => {
    if (!hasWritePermission) return;
    setEditingId(item.id);
    setError(null);

    if (activeTab === 'empresas') {
      setEmpresaName(item.name);
      setEmpresaLogo(item.logo);
    } else if (activeTab === 'agents') {
      setAgentName(item.name);
      setAgentPrompt(item.prompt || '');
      setAgentPhone(item.phone_number || '');
      setAgentInstance(item.instance_name || '');
      setAgentStatus(item.status);
      setAgentEmpresaId(item.empresa_id);
      setAgentUpsertLead(item.upsert_lead);
      setAgentTranslations(JSON.stringify(item.translations || {}, null, 2));
      setAgentSearch(!!item.search);
      setAgentSearchData(JSON.stringify(item.search_data || { itens: [], filters: {}, schema: {} }, null, 2));
      setAgentValidate(!!item.validate);
      setAgentValidateData(JSON.stringify(item.validate_data || { itens: [], filters: {}, schema: {} }, null, 2));
      setAgentActiveSubtab('prompt');
    } else if (activeTab === 'follow-ups') {
      setFollowOrder(item.order);
      setFollowMessage(item.message);
      setFollowTime(item.time);
      setFollowAgentId(item.agent_id);
      setFollowActive(item.active);
    } else if (activeTab === 'leads') {
      setLeadAgentId(item.agent_id);
      setLeadRemoteJid(item.remote_jid_alt);
      setLeadName(item.name || '');
      setLeadStatus(item.status);
      setLeadValue(item.value ? String(item.value) : '');
      setLeadTakenMotive(item.taken_motive || '');
      setLeadFollowUpId(item.follow_up_id);
      setLeadSessionId(item.session_id || '');
      setLeadCustomProperties(JSON.stringify(item.custom_properties || {}, null, 2));
    }

    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    try {
      if (activeTab === 'empresas') {
        if (editingId) {
          await updateEmpresa(editingId, empresaName, empresaLogo);
        } else {
          await createEmpresa(empresaName, empresaLogo);
        }
      } else if (activeTab === 'agents') {
        const payload = {
          name: agentName, prompt: agentPrompt, phone_number: agentPhone,
          instance_name: agentInstance, status: agentStatus, empresa_id: agentEmpresaId,
          upsert_lead: agentUpsertLead,
          translations: JSON.parse(agentTranslations || '{}'),
          search: agentSearch,
          search_data: JSON.parse(agentSearchData || '{"itens": [], "filters": {}, "schema": {}}'),
          validate: agentValidate,
          validate_data: JSON.parse(agentValidateData || '{"itens": [], "filters": {}, "schema": {}}')
        };
        if (editingId) {
          await updateAgent(editingId, payload);
        } else {
          await createAgent(payload);
        }
      } else if (activeTab === 'follow-ups') {
        const payload = {
          order: followOrder, message: followMessage, time: followTime,
          agent_id: followAgentId, active: followActive
        };
        if (editingId) {
          await updateFollowUp(editingId, payload);
        } else {
          await createFollowUp(payload);
        }
      } else if (activeTab === 'leads') {
        const payload = {
          agent_id: leadAgentId, remote_jid_alt: leadRemoteJid, name: leadName || null,
          custom_properties: JSON.parse(leadCustomProperties || '{}'),
          status: leadStatus, value: leadValue ? Number(leadValue) : null,
          taken_motive: leadTakenMotive || null, follow_up_id: leadFollowUpId,
          session_id: leadSessionId || null
        };
        if (editingId) {
          await updateLead(editingId, payload);
        } else {
          await createLead(payload);
        }
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = (id: number, name: string) => {
    setDeleteModal({ isOpen: true, id, type: activeTab, name });
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      if (deleteModal.type === 'empresas') {
        await deleteEmpresa(deleteModal.id);
      } else if (deleteModal.type === 'agents') {
        await deleteAgent(deleteModal.id);
      } else if (deleteModal.type === 'follow-ups') {
        await deleteFollowUp(deleteModal.id);
      } else if (deleteModal.type === 'leads') {
        await deleteLead(deleteModal.id);
      }
      setDeleteModal({ isOpen: false, id: 0, type: 'empresas', name: '' });
    } catch (err: any) {
      setError(err.message || 'Erro ao inativar');
    } finally {
      setActionLoading(false);
    }
  };

  const isLoadingTab = () => {
    if (activeTab === 'empresas') return loadingEmp;
    if (activeTab === 'agents') return loadingAg || loadingEmp;
    if (activeTab === 'follow-ups') return loadingFl || loadingAg;
    if (activeTab === 'leads') return loadingLd || loadingAg || loadingFl;
    return loadingLd || loadingAg || loadingEmp;
  };

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className={`sidebar ${isMainSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: isMainSidebarCollapsed ? 'center' : 'space-between', width: '100%' }}>
          {!isMainSidebarCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={24} style={{ color: 'hsl(var(--primary))' }} />
              <span>DeltaAI Admin</span>
            </div>
          ) : (
            <Building2 size={24} style={{ color: 'hsl(var(--primary))' }} />
          )}
          <button
            onClick={() => setIsMainSidebarCollapsed(!isMainSidebarCollapsed)}
            style={{
              color: 'hsl(var(--muted-foreground))',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              background: 'transparent'
            }}
            title={isMainSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            <Menu size={20} />
          </button>
        </div>
        <nav>
          <ul className="menu-list">
            {isSuperAdmin && (
              <li className={`menu-item ${activeTab === 'empresas' ? 'active' : ''}`}>
                <button onClick={() => setActiveTab('empresas')} title="Empresas">
                  <Building2 size={20} />
                  <span>Empresas</span>
                </button>
              </li>
            )}
            <li className={`menu-item ${activeTab === 'agents' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('agents')} title="Agentes">
                <Users size={20} />
                <span>Agentes</span>
              </button>
            </li>
            <li className={`menu-item ${activeTab === 'follow-ups' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('follow-ups')} title="Follow-ups">
                <ClipboardList size={20} />
                <span>Follow-ups</span>
              </button>
            </li>
            <li className={`menu-item ${activeTab === 'leads' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('leads')} title="Leads">
                <UserCheck size={20} />
                <span>Leads</span>
              </button>
            </li>
            <li className={`menu-item ${activeTab === 'messages' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('messages')} title="Histórico de Chat">
                <MessageSquare size={20} />
                <span>Histórico de Chat</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* MAIN CONTAINER */}
      <main className={`main-content ${isMainSidebarCollapsed ? 'full-width' : ''}`}>
        <div className="page-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <div className="page-title">
            <h1>
              {activeTab === 'empresas' && 'Empresas'}
              {activeTab === 'agents' && 'Agentes'}
              {activeTab === 'follow-ups' && 'Configurações de Follow-up'}
              {activeTab === 'leads' && 'Leads'}
              {activeTab === 'messages' && 'Histórico de Chat / Mensagens'}
            </h1>
            <p>
              {activeTab === 'empresas' && 'Gerencie as organizações cadastradas e seus logos.'}
              {activeTab === 'agents' && 'Configure os agentes conversacionais para atendimento.'}
              {activeTab === 'follow-ups' && 'Defina tempos, mensagens e sequências de follow-up.'}
              {activeTab === 'leads' && 'Controle os leads capturados e seus estados.'}
              {activeTab === 'messages' && 'Visualização integrada dos chats armazenados na memória do n8n ou banco local.'}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto' }}>
            <LoginMock empresas={empresas} />

            {(activeTab === 'empresas' || activeTab === 'agents') && (
              <button
                className={`btn btn-sm ${showInactive ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setShowInactive(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '13px',
                  opacity: showInactive ? 1 : 0.7,
                  border: showInactive ? '1px solid hsl(var(--primary) / 0.5)' : '1px solid hsl(var(--card-border))'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: showInactive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', display: 'inline-block' }} />
                {showInactive ? 'Ocultando ativos' : 'Mostrar inativos'}
              </button>
            )}
            {activeTab !== 'messages' && hasWritePermission && (
              <button className="btn btn-primary" onClick={openCreateForm}>
                <Plus size={16} /> Novo
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444', padding: '16px', borderRadius: 'var(--radius)', marginBottom: '24px'
          }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {isLoadingTab() ? (
          <SkeletonView tab={activeTab} />
        ) : (
          <>
            {activeTab === 'empresas' && isSuperAdmin && (
              <div className="dashboard-grid">
                {getFilteredEmpresas().map(emp => (
                  <div key={emp.id} className="card" style={!emp.active ? { opacity: 0.6 } : {}}>
                    <div className="card-header">
                      {emp.logo ? (
                        <img src={`data:image/png;base64,${emp.logo}`} alt={emp.name} className="company-logo" />
                      ) : (
                        <div className="company-logo-placeholder">{emp.name.charAt(0).toUpperCase()}</div>
                      )}
                      <span className={`badge ${emp.active ? 'badge-success' : 'badge-danger'}`}>
                        {emp.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <div className="card-body">
                      <h3 className="card-title">{emp.name}</h3>
                      <span style={{ fontSize: '12px', marginTop: '8px' }}>
                        Criado em: {new Date(emp.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="card-footer">
                      {emp.active && (
                        <>
                          <a href={getBoardUrl(emp.id, emp.name)} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                            🔗 Board
                          </a>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEditForm(emp)}>
                            <Pencil size={12} /> Editar
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => confirmDelete(emp.id, emp.name)}>
                            <Trash2 size={12} /> Inativar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'agents' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {getGroupedAgents().map(empGroup => (
                  <div key={empGroup.empresaId} style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--card-border))', borderRadius: 'var(--radius)', padding: '24px' }}>
                    <div className="tree-empresa-header" style={{ borderBottom: '2px solid hsl(var(--card-border))', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {empGroup.empresaLogo ? (
                        <img src={`data:image/png;base64,${empGroup.empresaLogo}`} alt={empGroup.empresaName} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <Building2 size={18} style={{ color: 'hsl(var(--primary))' }} />
                      )}
                      <span style={{ fontWeight: 700 }}>{empGroup.empresaName}</span>
                    </div>
                    <div className="dashboard-grid">
                      {empGroup.agents.map(ag => {
                        const isInactive = ag.status === 0;
                        return (
                          <div key={ag.id} className="card" style={isInactive ? { opacity: 0.6 } : {}}>
                            <div className="card-header">
                              <span className={`badge ${isInactive ? 'badge-danger' : ag.status === 1 ? 'badge-success' : 'badge-warning'}`}>
                                {isInactive ? 'Inativo' : ag.status === 1 ? 'Ativo' : 'Pendente'}
                              </span>
                            </div>
                            <div className="card-body">
                              <h3 className="card-title">{ag.name}</h3>
                              <p><strong>Telefone:</strong> {ag.phone_number}</p>
                              <p>
                                <strong>Instância:</strong> {ag.instance_name}{' '}
                                {ag.instance_name && !isInactive && (
                                  <span className={`badge ${ag.evolution_status === 'open' || ag.evolution_status === 'connected' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '9px', marginLeft: '6px' }}>
                                    {ag.evolution_status || 'desconectado'}
                                  </span>
                                )}
                              </p>
                              <p style={{ maxHeight: '80px', overflow: 'hidden' }}>
                                <strong>Prompt:</strong> {ag.prompt}
                              </p>
                            </div>
                            <div className="card-footer">
                              {!isInactive && ag.instance_name && ag.evolution_status !== 'open' && ag.evolution_status !== 'connected' && hasWritePermission && (
                                <button className="btn btn-primary btn-sm" onClick={() => showEvolutionQrCode(ag.instance_name)}>
                                  ⚡ QR Code
                                </button>
                              )}
                              {hasWritePermission && (
                                <>
                                  <button className="btn btn-secondary btn-sm" onClick={() => openEditForm(ag)}>
                                    <Pencil size={12} /> Editar
                                  </button>
                                  {!isInactive && (
                                    <button className="btn btn-danger btn-sm" onClick={() => confirmDelete(ag.id, ag.name)}>
                                      <Trash2 size={12} /> Inativar
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'follow-ups' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {getGroupedFollowUps().map(empGroup => (
                  <div key={empGroup.empresaId} style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--card-border))', borderRadius: 'var(--radius)', padding: '24px' }}>
                    <div style={{ borderBottom: '2px solid hsl(var(--card-border))', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Building2 size={18} style={{ color: 'hsl(var(--primary))' }} />
                      <span style={{ fontWeight: 700 }}>{empGroup.empresaName}</span>
                    </div>
                    {empGroup.agents.map(agGroup => (
                      <div key={agGroup.agentId} style={{ marginLeft: '12px', marginTop: '16px' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0' }}>
                          <Users size={16} />
                          <span>{agGroup.agentName}</span>
                        </h4>
                        <div className="dashboard-grid">
                          {agGroup.followUps.map(fl => (
                            <div key={fl.id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
                              <div className="card-header" style={{ marginBottom: '12px' }}>
                                <span className="badge badge-info">Passo {fl.order}</span>
                                <span className={`badge ${fl.active ? 'badge-success' : 'badge-danger'}`}>{fl.active ? 'Ativo' : 'Inativo'}</span>
                              </div>
                              <div className="card-body" style={{ flex: 1, padding: 0 }}>
                                <p><strong>Tempo:</strong> {fl.time} min</p>
                                <blockquote style={{ borderLeft: '3px solid hsl(var(--primary))', paddingLeft: '10px', fontStyle: 'italic' }}>
                                  "{fl.message}"
                                </blockquote>
                              </div>
                              {hasWritePermission && (
                                <div className="card-footer" style={{ marginTop: '16px', paddingBottom: 0 }}>
                                  <button className="btn btn-secondary btn-sm" onClick={() => openEditForm(fl)}>
                                    <Pencil size={12} /> Editar
                                  </button>
                                  <button className="btn btn-danger btn-sm" onClick={() => confirmDelete(fl.id, `Follow-up ${fl.order}`)}>
                                    <Trash2 size={12} /> Inativar
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'leads' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--card-border))', padding: '16px', borderRadius: 'var(--radius)' }}>
                  {isSuperAdmin && (
                    <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>Empresa</label>
                      <select className="form-control" value={filterEmpresaId} onChange={e => setFilterEmpresaId(e.target.value)}>
                        <option value="">Todas</option>
                        {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>Agente</label>
                    <select className="form-control" value={filterAgentId} onChange={e => setFilterAgentId(e.target.value)}>
                      <option value="">Todos</option>
                      {getFilteredAgents().filter(ag => filterEmpresaId === '' || ag.empresa_id === Number(filterEmpresaId)).map(ag => (
                        <option key={ag.id} value={ag.id}>{ag.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>JID</th>
                        <th>Agente</th>
                        <th>Status</th>
                        <th>Valor</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredLeads().filter(ld => {
                        if (filterEmpresaId !== '') {
                          const ag = agents.find(a => a.id === ld.agent_id);
                          if (!ag || ag.empresa_id !== Number(filterEmpresaId)) return false;
                        }
                        if (filterAgentId !== '' && ld.agent_id !== Number(filterAgentId)) return false;
                        return true;
                      }).map(ld => (
                        <tr key={ld.id}>
                          <td>{ld.name || 'Sem nome'}</td>
                          <td>{ld.remote_jid_alt}</td>
                          <td>{ld.agent_name || 'Sem agente'}</td>
                          <td><Badge status={ld.status} /></td>
                          <td>{ld.value ? `R$ ${ld.value}` : '-'}</td>
                          <td>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedLeadId(ld.id); setActiveTab('messages'); }}>
                              💬 Chat
                            </button>
                            {hasWritePermission && (
                              <>
                                <button className="btn btn-secondary btn-sm" onClick={() => openEditForm(ld)}>
                                  Editar
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => confirmDelete(ld.id, ld.name || ld.remote_jid_alt)}>
                                  Excluir
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '32px', height: 'calc(100vh - 200px)' }}>
                <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--card-border))', borderRadius: 'var(--radius)', padding: '20px', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid hsl(var(--card-border))' }}>
                    <Search size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
                    <input type="text" placeholder="Buscar lead..." value={chatSearchQuery} onChange={e => setChatSearchQuery(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--foreground))', outline: 'none', width: '100%', fontSize: '13px' }} />
                  </div>
                  {getGroupedLeads().map(empGroup => (
                    <div key={empGroup.empresaId} style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', marginBottom: '8px' }}>{empGroup.empresaName}</h4>
                      {empGroup.agents.map(agGroup => (
                        <div key={agGroup.agentId} style={{ marginLeft: '8px' }}>
                          <h5 style={{ fontSize: '11px', color: 'hsl(var(--primary))', margin: '4px 0' }}>{agGroup.agentName}</h5>
                          {agGroup.leads.map(ld => (
                            <button
                              key={ld.id}
                              onClick={() => setSelectedLeadId(ld.id)}
                              style={{
                                width: '100%', textAlign: 'left', padding: '10px', borderRadius: '8px', border: 'none',
                                background: selectedLeadId === ld.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                                color: selectedLeadId === ld.id ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                                cursor: 'pointer', fontSize: '13px', display: 'block', margin: '2px 0'
                              }}
                            >
                              {ld.name || ld.remote_jid_alt}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="chat-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {selectedLeadId ? (
                    <>
                      <div className="chat-header" style={{ padding: '16px', borderBottom: '1px solid hsl(var(--card-border))', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <h3>{getFilteredLeads().find(l => l.id === selectedLeadId)?.name || 'Conversa'}</h3>
                          <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>Fonte: {historySource} ({historyTable})</span>
                        </div>
                        <button className={`btn btn-sm ${liveMonitoring ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLiveMonitoring(!liveMonitoring)}>
                          {liveMonitoring ? '🟢 Monitorando' : 'Monitorar'}
                        </button>
                      </div>

                      <div className="chat-messages" ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {loadingHistory ? (
                          <div style={{ textAlign: 'center', padding: '20px' }}>Carregando histórico...</div>
                        ) : (
                          chatHistory.map(msg => {
                            const isAi = (msg.role || '').toLowerCase() === 'assistant' || (msg.role || '').toLowerCase() === 'bot' || (msg.role || '').toLowerCase() === 'ai' || (msg.source || '').toLowerCase() === 'bot' || (msg.source || '').toLowerCase() === 'ai';
                            return (
                              <div
                                key={msg.id}
                                style={{
                                  alignSelf: isAi ? 'flex-start' : 'flex-end',
                                  background: isAi ? 'hsl(var(--card))' : 'rgba(99,102,241,0.1)',
                                  border: '1px solid ' + (isAi ? 'hsl(var(--card-border))' : 'rgba(99,102,241,0.2)'),
                                  padding: '12px 16px', borderRadius: '12px', maxWidth: '70%'
                                }}
                              >
                                {msg.quoted_message_text && (
                                  <div style={{ borderLeft: '3px solid #ccc', paddingLeft: '8px', fontSize: '11px', opacity: 0.6, marginBottom: '6px' }}>
                                    {msg.quoted_message_text}
                                  </div>
                                )}
                                {msg.messageType && msg.messageType !== 'conversation' && msg.messageType !== 'extendedTextMessage' ? (
                                  <MediaMessageRenderer messageId={msg.id} messageType={msg.messageType} content={msg.content} />
                                ) : (
                                  <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                                )}
                                <div style={{ fontSize: '10px', textAlign: 'right', opacity: 0.5, marginTop: '4px' }}>
                                  {new Date(msg.createdAt).toLocaleTimeString()}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'hsl(var(--muted-foreground))' }}>
                      Selecione um lead para ver o histórico do chat.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* FORM DIALOG / MODAL */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid hsl(var(--card-border))', paddingBottom: '12px', marginBottom: '20px' }}>
              <h2>{editingId ? 'Editar' : 'Novo'} Registro</h2>
              <button onClick={() => setIsFormOpen(false)} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--foreground))', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeTab === 'empresas' && (
                <>
                  <div className="form-group">
                    <label>Nome da Empresa</label>
                    <input type="text" className="form-control" value={empresaName} onChange={e => setEmpresaName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Logo (Imagem)</label>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} />
                  </div>
                </>
              )}

              {activeTab === 'agents' && (
                <>
                  <div className="form-group">
                    <label>Nome do Agente</label>
                    <input type="text" className="form-control" value={agentName} onChange={e => setAgentName(e.target.value)} required />
                  </div>
                  {isSuperAdmin && (
                    <div className="form-group">
                      <label>Empresa</label>
                      <select className="form-control" value={agentEmpresaId} onChange={e => setAgentEmpresaId(Number(e.target.value))}>
                        {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="form-group">
                    <label>Prompt</label>
                    <textarea className="form-control" rows={4} value={agentPrompt} onChange={e => setAgentPrompt(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Telefone</label>
                    <input type="text" className="form-control" value={agentPhone} onChange={e => setAgentPhone(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Instância da Evolution API</label>
                    <select className="form-control" value={agentInstance} onChange={e => setAgentInstance(e.target.value)}>
                      <option value="">Selecione...</option>
                      {evolutionInstances.map(inst => (
                        <option key={inst.instanceName || inst.name} value={inst.instanceName || inst.name}>
                          {inst.instanceName || inst.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select className="form-control" value={agentStatus} onChange={e => setAgentStatus(Number(e.target.value))}>
                      <option value={1}>Ativo</option>
                      <option value={2}>Pendente</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="checkbox" checked={agentUpsertLead} onChange={e => setAgentUpsertLead(e.target.checked)} />
                    <label style={{ margin: 0 }}>Upsert Lead</label>
                  </div>
                </>
              )}

              {activeTab === 'follow-ups' && (
                <>
                  <div className="form-group">
                    <label>Ordem / Passo</label>
                    <input type="number" className="form-control" value={followOrder} onChange={e => setFollowOrder(Number(e.target.value))} required />
                  </div>
                  <div className="form-group">
                    <label>Agente</label>
                    <select className="form-control" value={followAgentId} onChange={e => setFollowAgentId(Number(e.target.value))}>
                      {getFilteredAgents().map(ag => <option key={ag.id} value={ag.id}>{ag.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Mensagem</label>
                    <textarea className="form-control" rows={3} value={followMessage} onChange={e => setFollowMessage(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Tempo de Espera (minutos)</label>
                    <input type="number" className="form-control" value={followTime} onChange={e => setFollowTime(Number(e.target.value))} required />
                  </div>
                  <div className="form-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="checkbox" checked={followActive} onChange={e => setFollowActive(e.target.checked)} />
                    <label style={{ margin: 0 }}>Ativo</label>
                  </div>
                </>
              )}

              {activeTab === 'leads' && (
                <>
                  <div className="form-group">
                    <label>Nome do Lead</label>
                    <input type="text" className="form-control" value={leadName} onChange={e => setLeadName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Agente Vinculado</label>
                    <select className="form-control" value={leadAgentId} onChange={e => setLeadAgentId(Number(e.target.value))}>
                      {getFilteredAgents().map(ag => <option key={ag.id} value={ag.id}>{ag.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Remote JID / Telefone</label>
                    <input type="text" className="form-control" value={leadRemoteJid} onChange={e => setLeadRemoteJid(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select className="form-control" value={leadStatus} onChange={e => setLeadStatus(e.target.value)}>
                      <option value="NOVO">NOVO</option>
                      <option value="HUMANO">HUMANO</option>
                      <option value="CONCLUIDO">CONCLUIDO</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Valor estimado</label>
                    <input type="text" className="form-control" value={leadValue} onChange={e => setLeadValue(e.target.value)} />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid hsl(var(--card-border))', paddingTop: '16px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} disabled={actionLoading}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETION MODAL */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Inativar Registro"
        description={`Tem certeza que deseja inativar "${deleteModal.name}"?`}
        onConfirm={handleDelete}
        onClose={() => setDeleteModal({ isOpen: false, id: 0, type: 'empresas', name: '' })}
        disabled={actionLoading}
      />

      {/* EVOLUTION QR CODE MODAL */}
      {qrModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid hsl(var(--card-border))', paddingBottom: '12px', marginBottom: '20px' }}>
              <h2>Conectar WhatsApp</h2>
              <button onClick={() => setQrModal(prev => ({ ...prev, isOpen: false }))} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--foreground))', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {qrModal.loading ? (
              <div style={{ padding: '40px' }}>Gerando QR Code...</div>
            ) : qrModal.error ? (
              <div style={{ color: 'red', padding: '20px' }}>{qrModal.error}</div>
            ) : qrModal.qrCode ? (
              <div>
                <img src={qrModal.qrCode} alt="WhatsApp QR Code" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid hsl(var(--card-border))' }} />
                <p style={{ marginTop: '16px', fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>Escaneie este QR Code no seu WhatsApp (Aparelhos conectados) para ativar a instância <strong>{qrModal.instanceName}</strong>.</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
