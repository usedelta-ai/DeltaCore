import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from './services/api';
import type { Agent, ChatMessage, Lead, LeadStatus } from './services/api';
import { LoginScreen } from './components/features/LoginScreen';
import { ChangePasswordScreen } from './components/features/ChangePasswordScreen';
import { TopAppBar } from './components/layout/TopAppBar';

import { useEmpresas } from './hooks/useEmpresas';
import { useAgents } from './hooks/useAgents';
import { useLeads } from './hooks/useLeads';
import { useFollowUps } from './hooks/useFollowUps';

// Pages
import pkg from '../package.json';
import { EmpresasPage } from './pages/EmpresasPage';
import { AgentsPage } from './pages/AgentsPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { MessagesPage } from './pages/MessagesPage';
import { UsersPage } from './pages/UsersPage';
import { DashboardPage } from './pages/DashboardPage';
import { ImmersiveLeadView } from './pages/ImmersiveLeadView';
import { PessoaModal } from './components/features/PessoaModal';
import { ProfileModal } from './components/features/ProfileModal';
import { PessoasPage } from './pages/PessoasPage';

// Layout
import { SideNavBar } from './components/layout/SideNavBar';

export type Tab = 'empresas' | 'agents' | 'follow-ups' | 'leads' | 'messages' | 'users' | 'pessoas';

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth-token'));
  const [user, setUser] = useState<{ id: number; name: string; email: string; role: string; empresa_id?: number | null; empresa_name?: string | null; empresa_logo?: string | null; avatar?: string | null } | null>(() => {
    const cached = localStorage.getItem('auth-user');
    return cached ? JSON.parse(cached) : null;
  });
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const isSuperAdmin = user?.role === 'superadmin';
  const companyId = user?.empresa_id || null;
  const hasWritePermission = true;

  const getTenantBase64FromUrl = (): string | null => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      const first = parts[0];
      try {
        const decoded = atob(first);
        if (/^\d+$/.test(decoded)) return first;
      } catch (_) {}
    }
    return null;
  };

  const getRouteInfo = (): { tenantBase64: string | null; tab: Tab; leadId: number | null } => {
    const pathname = window.location.pathname;
    const parts = pathname.split('/').filter(Boolean);
    let tenantBase64: string | null = null;
    let tabStr = '';
    let leadId: number | null = null;
    
    let partsOffset = 0;
    if (parts.length > 0) {
      const first = parts[0];
      let isTenant = false;
      try {
        const decoded = atob(first);
        if (/^\d+$/.test(decoded)) {
          isTenant = true;
        }
      } catch (_) {}
      
      if (isTenant) {
        tenantBase64 = first;
        partsOffset = 1;
      }
    }
    
    tabStr = parts[partsOffset] || '';
    const possibleLeadId = parts[partsOffset + 1];
    if (possibleLeadId && /^\d+$/.test(possibleLeadId)) {
      leadId = Number(possibleLeadId);
    }
    
    const validTabs: Tab[] = ['empresas', 'agents', 'follow-ups', 'leads', 'messages', 'users', 'pessoas'];
    let tab: Tab = isSuperAdmin ? 'empresas' : 'agents';
    if (validTabs.includes(tabStr as Tab)) {
      tab = tabStr as Tab;
    }
    
    return { tenantBase64, tab, leadId };
  };

  const [filterEmpresaId, setFilterEmpresaId] = useState<number | string>(() => {
    // Don't read URL params if we're on the messages tab (clean URL)
    if (window.location.pathname.includes('/messages')) return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('empresa') || '';
  });
  const [filterAgentId, setFilterAgentId] = useState<number | string>(() => {
    if (window.location.pathname.includes('/messages')) return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('agente') || '';
  });

  const { empresas, createEmpresa, updateEmpresa, deleteEmpresa } = useEmpresas(token);
  const { agents, createAgent, updateAgent, deleteAgent } = useAgents(token);
  const { leads, total: leadsTotal, summary: leadsSummary, loading: leadsLoading, isFetching: leadsFetching, isTransitioning: leadsTransitioning, createLead, updateLead, deleteLead, refetch: refetchLeads, searchTerm: leadsSearchTerm, setSearchTerm: setLeadsSearchTerm, month: leadsMonth, setMonth: setLeadsMonth } = useLeads(token, filterEmpresaId, filterAgentId);
  const { followUps, createFollowUp, updateFollowUp, deleteFollowUp } = useFollowUps(token);

  const currentCompany = companyId ? empresas.find(e => e.id === companyId) : null;
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const systemName = currentCompany?.name || user?.empresa_name || 'DeltaAI Admin';
  const systemLogoRaw = currentCompany?.logo || user?.empresa_logo || customLogo || null;
  const systemLogo = systemLogoRaw
    ? (systemLogoRaw.startsWith('data:') ? systemLogoRaw : `data:image/png;base64,${systemLogoRaw}`)
    : null;

  const [activeTab, setActiveTab] = useState<Tab>(() => getRouteInfo().tab);
  const [showInactive, _setShowInactive] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [leadCreateTrigger, setLeadCreateTrigger] = useState(0);
  const [pessoaCreateTrigger, setPessoaCreateTrigger] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);

  // Forms fields
  const [empresaName, setEmpresaName] = useState('');
  const [empresaLogo, setEmpresaLogo] = useState<string | null>(null);

  const [agentEditData, setAgentEditData] = useState<any>(null);

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
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isMainSidebarCollapsed, setIsMainSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) return saved === 'true';
    return getRouteInfo().tab === 'messages' || getRouteInfo().tab === 'leads';
  });

  const [leadViewMode, setLeadViewMode] = useState<'dashboard' | 'immersive' | null>(() => {
    return getRouteInfo().leadId ? 'immersive' : null;
  });
  const [selectedImmersiveLeadId, setSelectedImmersiveLeadId] = useState<number | null>(() => getRouteInfo().leadId);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [selectedPessoaId, setSelectedPessoaId] = useState<number | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Fetch empresa logo when user has empresa_id but no logo found
  useEffect(() => {
    if (!token || !user?.empresa_id || systemLogo) return;
    const base64Id = btoa(String(user.empresa_id));
    api.getPublicEmpresa(base64Id)
      .then(emp => {
        if (emp?.logo) setCustomLogo(emp.logo);
      })
      .catch(() => {});
  }, [token, user?.empresa_id, systemLogo]);

  useEffect(() => {
    document.title = systemName;

    const link = document.querySelector<HTMLLinkElement>('link#favicon');
    if (link) {
      if (systemLogo) {
        link.href = systemLogo;
        link.type = 'image/png';
      } else {
        link.href = '/logo.jpg';
        link.type = 'image/jpeg';
      }
    }
  }, [systemName, systemLogo]);

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

  const agentsMap = useMemo(() => {
    const map = new Map<number, Agent>();
    agents.forEach(a => map.set(a.id, a));
    return map;
  }, [agents]);

  const getFilteredLeads = () => {
    if (isSuperAdmin) return leads;
    return leads.filter(l => {
      const agent = agentsMap.get(l.agent_id);
      return agent && agent.empresa_id === companyId;
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
      const agent = agentsMap.get(lead.agent_id);
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
      const agent = agentsMap.get(fl.agent_id);
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

  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setIsMainSidebarCollapsed(true);
  }, [activeTab, leadViewMode]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, selectedLeadId]);

  useEffect(() => {
    const tenantBase64 = getTenantBase64FromUrl();
    let basePath = tenantBase64 ? `/${tenantBase64}/${activeTab}` : `/${activeTab}`;

    if (activeTab === 'leads' && leadViewMode === 'immersive' && selectedImmersiveLeadId) {
      basePath += `/${selectedImmersiveLeadId}`;
    }

    if (activeTab === 'messages') {
      let search = '';
      if (selectedLeadId) {
        const lead = getFilteredLeads().find(l => l.id === selectedLeadId);
        if (lead && lead.session_id) {
          search = `?session_id=${lead.session_id}`;
        }
      }
      window.history.replaceState(null, '', basePath + search);
    } else {
      const params = new URLSearchParams();
      if (filterEmpresaId) params.set('empresa', String(filterEmpresaId));
      if (filterAgentId) params.set('agente', String(filterAgentId));
      const search = params.toString() ? `?${params.toString()}` : '';
      window.history.replaceState(null, '', basePath + search);
    }
  }, [activeTab, selectedLeadId, filterEmpresaId, filterAgentId, leadViewMode, selectedImmersiveLeadId]);

  // Load chat history
  useEffect(() => {
    if (activeTab === 'messages' && selectedLeadId) {
      (async () => {
        try {
          const res = await api.getLeadAgentHistory(selectedLeadId);
          setChatHistory(res.messages);
          setHistorySource(res.source);
          setHistoryTable(res.tableName || '');
        } catch (err: any) {
          setError(err.message || 'Erro ao carregar chat');
        }
      })();
    }
  }, [selectedLeadId, activeTab]);

  // Live monitor — polls when a non‑finalized lead is selected
  useEffect(() => {
    if (!(activeTab === 'messages' && selectedLeadId)) return;
    const lead = getFilteredLeads().find(l => l.id === selectedLeadId);
    if (!lead || lead.status === 'FINALIZADO' || lead.status === 'CONCLUIDO') return;
    const ticker = setInterval(async () => {
      try {
        const historyRes = await api.getLeadAgentHistory(selectedLeadId);
        setChatHistory(prev => {
          const newMsgs = historyRes.messages;
          if (prev.length !== newMsgs.length) return newMsgs;
          if (prev.length > 0 && newMsgs.length > 0) {
            const a = prev[prev.length - 1];
            const b = newMsgs[newMsgs.length - 1];
            if (a.id !== b.id || a.content !== b.content) return newMsgs;
          }
          return prev;
        });
        refetchLeads();
      } catch (_) {}
    }, 3000);
    return () => clearInterval(ticker);
  }, [selectedLeadId, activeTab]);

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

  useEffect(() => {
    if (!isFormOpen) {
      setAgentEditData(null);
    }
  }, [isFormOpen]);

  const openCreateForm = () => {
    if (!hasWritePermission) return;
    setEditingId(null);
    setError(null);

    if (activeTab === 'empresas') {
      setEmpresaName('');
      setEmpresaLogo(null);
    } else if (activeTab === 'agents') {
      setAgentEditData({
        name: '',
        prompt: '',
        phone_number: '',
        instance_name: '',
        status: 1,
        empresa_id: isSuperAdmin ? empresas[0]?.id || 0 : (companyId || 0),
        upsert_lead: true,
        translations: {},
        search: false,
        search_data: { itens: [], filters: {}, schema: {} },
        validate: false,
        validate_data: { itens: [], filters: {}, schema: {} },
      });
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
      setAgentEditData(item);
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
          status: leadStatus as LeadStatus, value: leadValue ? Number(leadValue) : null,
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

  const handleAgentSave = async (payload: any) => {
    setActionLoading(true);
    setError(null);
    try {
      if (editingId) {
        await updateAgent(editingId, payload);
      } else {
        await createAgent(payload);
      }
      setIsFormOpen(false);
      setAgentEditData(null);
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


  const handleLeadClick = (leadId: number) => {
    setSelectedImmersiveLeadId(leadId);
    setLeadViewMode('immersive');
  };

  const handleBackFromImmersive = () => {
    setLeadViewMode('dashboard');
    setSelectedImmersiveLeadId(null);
    refetchLeads();
  };

  const handleNewLeadAcknowledged = () => {
    setLeadCreateTrigger(0);
  };

  const handleNewLead = () => {
    setLeadViewMode('dashboard');
    setLeadCreateTrigger(prev => prev + 1);
  };

  const handlePessoaCreateAcknowledged = () => {
    setPessoaCreateTrigger(0);
  };

  const handleAddButton = () => {
    if (activeTab === 'leads') {
      handleNewLead();
    } else if (activeTab === 'pessoas') {
      setPessoaCreateTrigger(prev => prev + 1);
    } else {
      openCreateForm();
    }
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
      setMustChangePassword(false);
    };
    const handleSessionRevoked = () => {
      setToken(null);
      setUser(null);
      setMustChangePassword(false);
      alert('Sua sessão foi encerrada porque outro login foi realizado com sua conta.');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('auth:session-revoked', handleSessionRevoked);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('auth:session-revoked', handleSessionRevoked);
    };
  }, []);

  const handleAvatarUpdate = (avatar: string | null) => {
    if (user) {
      const updated = { ...user, avatar };
      setUser(updated);
      localStorage.setItem('auth-user', JSON.stringify(updated));
    }
  };

  const navigateToTab = (tab: Tab) => {
    const tenantBase64 = getTenantBase64FromUrl();
    const path = tenantBase64 ? `/${tenantBase64}/${tab}` : `/${tab}`;
    window.history.pushState(null, '', path);
    setActiveTab(tab);
    if (tab === 'leads') {
      setLeadViewMode('dashboard');
    } else {
      setLeadViewMode(null);
    }
    setSelectedImmersiveLeadId(null);
  };

  // Auto-select single agent in kanban filter
  useEffect(() => {
    const myAgents = getFilteredAgents();
    if (!filterAgentId && myAgents.length === 1) {
      setFilterAgentId(myAgents[0].id);
    }
  }, [agents, filterAgentId, companyId, isSuperAdmin]);

  // Refresh user data (including avatar) on mount
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api.getMe()
      .then((freshUser: any) => {
        if (!cancelled && freshUser) {
          localStorage.setItem('auth-user', JSON.stringify(freshUser));
          setUser(freshUser);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token]);

  // Safe Navigation Handler
  useEffect(() => {
    const handlePopState = () => {
      const { tab } = getRouteInfo();
      setActiveTab(tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLoginSuccess = (newToken: string, newUser: any, newMustChangePassword: boolean) => {
    localStorage.setItem('auth-token', newToken);
    localStorage.setItem('auth-user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setMustChangePassword(newMustChangePassword);

    if (newMustChangePassword) return;

    const tenantBase64 = getTenantBase64FromUrl();
    const defaultTab = newUser.role === 'superadmin' ? 'empresas' : 'agents';
    const path = tenantBase64 ? `/${tenantBase64}/${defaultTab}` : `/${defaultTab}`;
    window.history.replaceState(null, '', path);
    setActiveTab(defaultTab);
  };

  const handlePasswordChanged = () => {
    setMustChangePassword(false);
    const tenantBase64 = getTenantBase64FromUrl();
    const defaultTab = user?.role === 'superadmin' ? 'empresas' : 'agents';
    const path = tenantBase64 ? `/${tenantBase64}/${defaultTab}` : `/${defaultTab}`;
    window.history.replaceState(null, '', path);
    setActiveTab(defaultTab);
  };

  const handleLogout = () => {
    api.logout().catch(() => {});
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
    setToken(null);
    setUser(null);
    setMustChangePassword(false);
  };

  if (!token || !user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (token && mustChangePassword) {
    return <ChangePasswordScreen userName={user.name} onPasswordChanged={handlePasswordChanged} onLogout={handleLogout} />;
  }

  if (leadViewMode === 'immersive') {
    return (
      <>
        <ImmersiveLeadView
          leadId={selectedImmersiveLeadId ?? undefined}
          onBack={handleBackFromImmersive}
          systemLogo={systemLogo}
          userName={user?.name}
          isSuperAdmin={isSuperAdmin}
          systemName={systemName}
          onTabChange={navigateToTab}
          onLogout={handleLogout}
          isSidebarCollapsed={isMainSidebarCollapsed}
          onToggleSidebarCollapse={() => {
            const next = !isMainSidebarCollapsed;
            setIsMainSidebarCollapsed(next);
            localStorage.setItem('sidebar_collapsed', String(next));
          }}
          hasWritePermission={hasWritePermission}
          agents={getFilteredAgents()}
          onPessoaClick={setSelectedPessoaId}
          userAvatar={user?.avatar}
          appVersion={pkg.version}
        />
        {selectedPessoaId !== null && (
          <PessoaModal
            pessoaId={selectedPessoaId}
            onClose={() => setSelectedPessoaId(null)}
            onLeadClick={(leadId) => {
              setSelectedPessoaId(null);
              handleLeadClick(leadId);
            }}
          />
        )}
      </>
    );
  }

  return (
    <div>
      <SideNavBar
        activeTab={activeTab}
        onTabChange={navigateToTab}
        onNewLead={handleAddButton}
        systemName={systemName}
        systemLogo={systemLogo}
        isSuperAdmin={isSuperAdmin}
        collapsed={isMainSidebarCollapsed}
        onToggleCollapse={() => {
          const next = !isMainSidebarCollapsed;
          setIsMainSidebarCollapsed(next);
          localStorage.setItem('sidebar_collapsed', String(next));
        }}
        onLogout={handleLogout}
        userName={user?.name}
        appVersion={pkg.version}
      />
      <TopAppBar
        onProfileClick={() => setIsProfileModalOpen(true)}
        userAvatar={user?.avatar || null}
        userName={user?.name}
      />
      <main className={`${isMainSidebarCollapsed ? 'ml-20' : 'ml-64'} mt-16 ${activeTab === 'leads' && (leadViewMode === 'dashboard' || leadViewMode === null) ? 'px-5 py-4' : 'p-gutter'} min-h-[calc(100vh-64px)] overflow-x-auto`}>
        {activeTab === 'leads' && (leadViewMode === 'dashboard' || leadViewMode === null) && (
          <DashboardPage
            onLeadClick={handleLeadClick}
onNewLead={handleAddButton}
            createLead={createLead}
            leads={getFilteredLeads()}
            leadsTotal={leadsTotal}
            leadsSummary={leadsSummary}
            agents={agents}
            agentsMap={agentsMap}
            empresas={empresas}
            updateLead={updateLead}
            onRefresh={refetchLeads}
            filterEmpresaId={filterEmpresaId}
            filterAgentId={filterAgentId}
            onFilterEmpresaChange={setFilterEmpresaId}
            onFilterAgentChange={setFilterAgentId}
            onPessoaClick={setSelectedPessoaId}
            loading={leadsLoading}
            isFetching={leadsFetching}
            filterTransitioning={leadsTransitioning}
            searchTerm={leadsSearchTerm}
            onSearchChange={setLeadsSearchTerm}
            month={leadsMonth}
            onMonthChange={setLeadsMonth}
            hasWritePermission={hasWritePermission}
            leadCreateTrigger={leadCreateTrigger}
            onLeadCreateAcknowledged={handleNewLeadAcknowledged}
            isSuperAdmin={isSuperAdmin}
            currentUserEmpresaId={companyId}
          />
        )}

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
            isSuperAdmin={isSuperAdmin}
            empresas={empresas}
            showEvolutionQrCode={showEvolutionQrCode}
            openEditForm={openEditForm}
            confirmDelete={confirmDelete}
            isFormOpen={isFormOpen}
            setIsFormOpen={setIsFormOpen}
            editingId={editingId}
            agentEditData={agentEditData}
            handleAgentSave={handleAgentSave}
            evolutionInstances={evolutionInstances}
            actionLoading={actionLoading}
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

        {activeTab === 'messages' && (
          <MessagesPage
            chatSearchQuery={chatSearchQuery}
            setChatSearchQuery={setChatSearchQuery}
            getGroupedLeads={getGroupedLeads}
            selectedLeadId={selectedLeadId}
            setSelectedLeadId={setSelectedLeadId}
            chatHistory={chatHistory}
            historySource={historySource}
            historyTable={historyTable}
            chatContainerRef={chatContainerRef}
            selectedLeadName={getFilteredLeads().find(l => l.id === selectedLeadId)?.name || 'Conversa'}
            userName={user?.name}
            systemLogo={systemLogo}
          />
        )}

        {activeTab === 'users' && isSuperAdmin && (
          <UsersPage empresas={empresas} token={token} />
        )}

        {activeTab === 'pessoas' && (
          <PessoasPage
            onPessoaClick={setSelectedPessoaId}
            leads={getFilteredLeads()}
            createTrigger={pessoaCreateTrigger}
            onCreateAcknowledged={handlePessoaCreateAcknowledged}
            isSuperAdmin={isSuperAdmin}
          />
        )}
      </main>
      {selectedPessoaId !== null && (
        <PessoaModal
          pessoaId={selectedPessoaId}
          onClose={() => setSelectedPessoaId(null)}
          onLeadClick={(leadId) => {
            setSelectedPessoaId(null);
            handleLeadClick(leadId);
          }}
        />
      )}

      {user && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={user}
          onAvatarUpdate={handleAvatarUpdate}
        />
      )}
    </div>
  );
}
