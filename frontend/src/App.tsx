import React, { useState, useEffect, useRef } from 'react';
import {
  Building2, Users, ClipboardList,
  MessageSquare, Plus, AlertCircle, UserCheck, Menu, UserCog
} from 'lucide-react';
import { api } from './services/api';
import type { Agent, ChatMessage, Lead } from './services/api';
import { SkeletonView } from './components/ui/SkeletonView';
import { LoginScreen } from './components/features/LoginScreen';

import { useEmpresas } from './hooks/useEmpresas';
import { useAgents } from './hooks/useAgents';
import { useLeads } from './hooks/useLeads';
import { useFollowUps } from './hooks/useFollowUps';

// Pages
import { EmpresasPage } from './pages/EmpresasPage';
import { AgentsPage } from './pages/AgentsPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { LeadsPage } from './pages/LeadsPage';
import { MessagesPage } from './pages/MessagesPage';
import { UsersPage } from './pages/UsersPage';

type Tab = 'empresas' | 'agents' | 'follow-ups' | 'leads' | 'messages' | 'users';

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth-token'));
  const [user, setUser] = useState<{ id: number; name: string; email: string; role: string; empresa_id?: number | null; empresa_name?: string | null; empresa_logo?: string | null } | null>(() => {
    const cached = localStorage.getItem('auth-user');
    return cached ? JSON.parse(cached) : null;
  });

  const isSuperAdmin = user?.role === 'superadmin';
  const companyId = user?.empresa_id || null;
  const hasWritePermission = user?.role !== 'employee';

  const [filterEmpresaId, setFilterEmpresaId] = useState<number | string>(() => {
    // Don't read URL params if we're on the messages tab (clean URL)
    if (window.location.hash.startsWith('#messages')) return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('empresa') || '';
  });
  const [filterAgentId, setFilterAgentId] = useState<number | string>(() => {
    if (window.location.hash.startsWith('#messages')) return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('agente') || '';
  });

  const { empresas, loading: loadingEmp, createEmpresa, updateEmpresa, deleteEmpresa } = useEmpresas(token);
  const { agents, loading: loadingAg, createAgent, updateAgent, deleteAgent } = useAgents(token);
  const { leads, loading: loadingLd, createLead, updateLead, deleteLead, refetch: refetchLeads } = useLeads(token, filterEmpresaId, filterAgentId);
  const { followUps, loading: loadingFl, createFollowUp, updateFollowUp, deleteFollowUp } = useFollowUps(token);

  const currentCompany = companyId ? empresas.find(e => e.id === companyId) : null;
  const systemName = currentCompany ? currentCompany.name : (user?.empresa_name || 'DeltaAI Admin');
  const systemLogo = currentCompany ? currentCompany.logo : (user?.empresa_logo || null);

  const getTabFromHash = (): Tab => {
    const hash = window.location.hash.replace('#', '');
    const tabPart = hash.split('?')[0];
    const validTabs: Tab[] = ['empresas', 'agents', 'follow-ups', 'leads', 'messages', 'users'];
    if (validTabs.includes(tabPart as Tab)) {
      return tabPart as Tab;
    }
    return isSuperAdmin ? 'empresas' : 'agents';
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
  const [agentTranslations] = useState('{}');
  const agentSearch = false;
  const agentSearchData = '{\n  "itens": [],\n  "filters": {},\n  "schema": {}\n}';
  const agentValidate = false;
  const agentValidateData = '{\n  "itens": [],\n  "filters": {},\n  "schema": {}\n}';

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



  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [historySource, setHistorySource] = useState<string>('');
  const [historyTable, setHistoryTable] = useState<string>('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [liveMonitoring, setLiveMonitoring] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isMainSidebarCollapsed, setIsMainSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) return saved === 'true';
    return getTabFromHash() === 'messages' || getTabFromHash() === 'leads';
  });

  const toggleSidebar = () => {
    const nextVal = !isMainSidebarCollapsed;
    setIsMainSidebarCollapsed(nextVal);
    localStorage.setItem('sidebar_collapsed', String(nextVal));
  };

  const chatContainerRef = useRef<HTMLDivElement | null>(null);

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
    name: string;
  }>({ isOpen: false, id: 0, name: '' });

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
    const groups: Record<number, { name: string; logo: string | null; agents: Record<number, { name: string; followUps: any[] }> }> = {};

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
    if (activeTab === 'messages' || activeTab === 'leads') {
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
    if (activeTab === 'messages') {
      // Clear any non-messages query params from the URL
      if (window.location.search) {
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState(null, '', cleanUrl);
      }
      // Set the hash with session_id if a lead is selected
      if (selectedLeadId) {
        const lead = getFilteredLeads().find(l => l.id === selectedLeadId);
        if (lead && lead.session_id) {
          const newHash = `#messages?session_id=${lead.session_id}`;
          if (window.location.hash !== newHash) {
            window.history.replaceState(null, '', window.location.pathname + newHash);
          }
        } else {
          window.history.replaceState(null, '', window.location.pathname + '#messages');
        }
      } else {
        window.history.replaceState(null, '', window.location.pathname + '#messages');
      }
    } else {
      // Leaving messages tab: restore filter params if they exist, set hash to current tab
      const params = new URLSearchParams();
      if (filterEmpresaId) params.set('empresa', String(filterEmpresaId));
      if (filterAgentId) params.set('agente', String(filterAgentId));
      const search = params.toString() ? `?${params.toString()}` : '';
      window.history.replaceState(null, '', window.location.pathname + search + `#${activeTab}`);
    }
  }, [activeTab, selectedLeadId]);

  // Load chat history
  useEffect(() => {
    if (activeTab === 'messages' && selectedLeadId) {
      const loadHistory = async () => {
        setLoadingHistory(true);
        try {
          const res = await api.getLeadAgentHistory(selectedLeadId);
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
          const historyRes = await api.getLeadAgentHistory(selectedLeadId);
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
    setDeleteModal({ isOpen: true, id, name });
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      if (activeTab === 'empresas') {
        await deleteEmpresa(deleteModal.id);
      } else if (activeTab === 'agents') {
        await deleteAgent(deleteModal.id);
      } else if (activeTab === 'follow-ups') {
        await deleteFollowUp(deleteModal.id);
      } else if (activeTab === 'leads') {
        await deleteLead(deleteModal.id);
      }
      setDeleteModal({ isOpen: false, id: 0, name: '' });
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

  // Safe Navigation Handler
  useEffect(() => {
    const handleHashChange = () => {
      const tab = getTabFromHash();
      setActiveTab(tab);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!token || !user) {
    return <LoginScreen onLoginSuccess={(newToken, newUser) => {
      localStorage.setItem('auth-token', newToken);
      localStorage.setItem('auth-user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    }} />;
  }

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className={`sidebar ${isMainSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: isMainSidebarCollapsed ? 'center' : 'space-between', width: '100%' }}>
          {!isMainSidebarCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {systemLogo ? (
                <img src={`data:image/png;base64,${systemLogo}`} alt={systemName} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <img src="/logo.jpg" alt="Delta Logo" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
              )}
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>{systemName}</span>
            </div>
          ) : (
            systemLogo ? (
              <img src={`data:image/png;base64,${systemLogo}`} alt={systemName} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <img src="/logo.jpg" alt="Delta Logo" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
            )
          )}
          <button
            onClick={toggleSidebar}
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
            {isSuperAdmin && (
              <li className={`menu-item ${activeTab === 'messages' ? 'active' : ''}`}>
                <button onClick={() => setActiveTab('messages')} title="Histórico de Chat">
                  <MessageSquare size={20} />
                  <span>Histórico de Chat</span>
                </button>
              </li>
            )}
            {isSuperAdmin && (
              <li className={`menu-item ${activeTab === 'users' ? 'active' : ''}`}>
                <button onClick={() => setActiveTab('users')} title="Usuários">
                  <UserCog size={20} />
                  <span>Usuários</span>
                </button>
              </li>
            )}
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
              {activeTab === 'users' && 'Gerenciamento de Usuários'}
            </h1>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--card-border))', borderRadius: '24px', padding: '6px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                Olá, <strong style={{ color: 'hsl(var(--primary))' }}>{user?.name}</strong> ({user?.role === 'superadmin' ? '🛡️ Super Admin' : user?.role === 'manager' ? '💼 Gerente' : '🧑‍💻 Funcionário'})
              </span>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '16px' }}
                onClick={() => {
                  localStorage.removeItem('auth-token');
                  localStorage.removeItem('auth-user');
                  window.location.reload();
                }}
              >
                Sair
              </button>
            </div>

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
            {activeTab !== 'messages' && activeTab !== 'users' && (activeTab === 'agents' ? isSuperAdmin : hasWritePermission) && (
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

        {isLoadingTab() && (activeTab === 'leads' ? leads.length === 0 : true) ? (
          <SkeletonView tab={activeTab} />
        ) : (
          <>
            {activeTab === 'empresas' && isSuperAdmin && (
              <EmpresasPage
                empresas={getFilteredEmpresas()}
                showInactive={showInactive}
                hasWritePermission={hasWritePermission}
                createEmpresa={createEmpresa}
                updateEmpresa={updateEmpresa}
                deleteEmpresa={deleteEmpresa}
                openCreateForm={openCreateForm}
                openEditForm={openEditForm}
                isFormOpen={isFormOpen}
                setIsFormOpen={setIsFormOpen}
                editingId={editingId}
                empresaName={empresaName}
                setEmpresaName={setEmpresaName}
                empresaLogo={empresaLogo}
                setEmpresaLogo={setEmpresaLogo}
                handleLogoUpload={handleLogoUpload}
                actionLoading={actionLoading}
                handleSave={handleSave}
                confirmDelete={confirmDelete}
                deleteModal={{ isOpen: deleteModal.isOpen, id: deleteModal.id, name: deleteModal.name }}
                handleDelete={handleDelete}
                setDeleteModal={setDeleteModal}
              />
            )}

            {activeTab === 'agents' && (
              <AgentsPage
                getGroupedAgents={getGroupedAgents}
                hasWritePermission={hasWritePermission}
                isSuperAdmin={isSuperAdmin}
                empresas={empresas}
                showEvolutionQrCode={showEvolutionQrCode}
                openEditForm={openEditForm}
                confirmDelete={confirmDelete}
                isFormOpen={isFormOpen}
                setIsFormOpen={setIsFormOpen}
                editingId={editingId}
                agentName={agentName}
                setAgentName={setAgentName}
                agentEmpresaId={agentEmpresaId}
                setAgentEmpresaId={setAgentEmpresaId}
                agentPrompt={agentPrompt}
                setAgentPrompt={setAgentPrompt}
                agentPhone={agentPhone}
                setAgentPhone={setAgentPhone}
                agentInstance={agentInstance}
                setAgentInstance={setAgentInstance}
                agentStatus={agentStatus}
                setAgentStatus={setAgentStatus}
                agentUpsertLead={agentUpsertLead}
                setAgentUpsertLead={setAgentUpsertLead}
                evolutionInstances={evolutionInstances}
                actionLoading={actionLoading}
                handleSave={handleSave}
                deleteModal={{ isOpen: deleteModal.isOpen, id: deleteModal.id, name: deleteModal.name }}
                handleDelete={handleDelete}
                setDeleteModal={setDeleteModal}
                qrModal={qrModal}
                setQrModal={setQrModal}
              />
            )}

            {activeTab === 'follow-ups' && (
              <FollowUpsPage
                getGroupedFollowUps={getGroupedFollowUps}
                getFilteredAgents={getFilteredAgents}
                hasWritePermission={hasWritePermission}
                openEditForm={openEditForm}
                confirmDelete={confirmDelete}
                isFormOpen={isFormOpen}
                setIsFormOpen={setIsFormOpen}
                editingId={editingId}
                followOrder={followOrder}
                setFollowOrder={setFollowOrder}
                followAgentId={followAgentId}
                setFollowAgentId={setFollowAgentId}
                followMessage={followMessage}
                setFollowMessage={setFollowMessage}
                followTime={followTime}
                setFollowTime={setFollowTime}
                followActive={followActive}
                setFollowActive={setFollowActive}
                actionLoading={actionLoading}
                handleSave={handleSave}
                deleteModal={{ isOpen: deleteModal.isOpen, id: deleteModal.id, name: deleteModal.name }}
                handleDelete={handleDelete}
                setDeleteModal={setDeleteModal}
              />
            )}

            {activeTab === 'leads' && (
              <LeadsPage
                updateLead={updateLead}
                getFilteredLeads={getFilteredLeads}
                getFilteredAgents={getFilteredAgents}
                isSuperAdmin={isSuperAdmin}
                empresas={empresas}
                agents={agents}
                filterEmpresaId={filterEmpresaId}
                setFilterEmpresaId={setFilterEmpresaId}
                filterAgentId={filterAgentId}
                setFilterAgentId={setFilterAgentId}
                hasWritePermission={hasWritePermission}
                openEditForm={openEditForm}
                confirmDelete={confirmDelete}
                setSelectedLeadId={setSelectedLeadId}
                setActiveTab={setActiveTab}
                isFormOpen={isFormOpen}
                setIsFormOpen={setIsFormOpen}
                editingId={editingId}
                leadName={leadName}
                setLeadName={setLeadName}
                leadAgentId={leadAgentId}
                setLeadAgentId={setLeadAgentId}
                leadRemoteJid={leadRemoteJid}
                setLeadRemoteJid={setLeadRemoteJid}
                leadStatus={leadStatus}
                setLeadStatus={setLeadStatus}
                leadValue={leadValue}
                setLeadValue={setLeadValue}
                actionLoading={actionLoading}
                handleSave={handleSave}
                deleteModal={{ isOpen: deleteModal.isOpen, id: deleteModal.id, name: deleteModal.name }}
                handleDelete={handleDelete}
                setDeleteModal={setDeleteModal}
                refetchLeads={refetchLeads}
                systemLogo={systemLogo}
                userName={user?.name}
              />
            )}

            {activeTab === 'messages' && (
              <MessagesPage
                chatSearchQuery={chatSearchQuery}
                setChatSearchQuery={setChatSearchQuery}
                getGroupedLeads={getGroupedLeads}
                selectedLeadId={selectedLeadId}
                setSelectedLeadId={setSelectedLeadId}
                liveMonitoring={liveMonitoring}
                setLiveMonitoring={setLiveMonitoring}
                chatHistory={chatHistory}
                loadingHistory={loadingHistory}
                historySource={historySource}
                historyTable={historyTable}
                chatContainerRef={chatContainerRef}
                selectedLeadName={getFilteredLeads().find(l => l.id === selectedLeadId)?.name || 'Conversa'}
                userName={user?.name}
                systemLogo={systemLogo}
              />
            )}

            {activeTab === 'users' && isSuperAdmin && (
              <UsersPage empresas={empresas} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
