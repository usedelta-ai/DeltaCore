const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const BOARD_URL = import.meta.env.VITE_BOARD_URL || '';

export function getBoardUrl(empresaId: number, empresaName: string): string {
  const token = btoa(`${empresaId}|${empresaName}`);
  return `${BOARD_URL}/${token}/board`;
}

let sessionExpired = false;

function forceLogout(code?: string) {
  if (sessionExpired) return;
  sessionExpired = true;
  localStorage.removeItem('auth-token');
  localStorage.removeItem('auth-user');
  if (code === 'SESSION_REVOKED') {
    window.dispatchEvent(new CustomEvent('auth:session-revoked'));
  } else {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${path}`;
  const token = localStorage.getItem('auth-token') || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options?.headers) {
    Object.entries(options.headers).forEach(([k, v]) => {
      headers[k] = v;
    });
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      forceLogout(errorData.code);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export interface Empresa {
  id: number;
  created_at: string;
  name: string;
  logo: string | null; // Base64 string
  active: boolean;
}

export interface Agent {
  id: number;
  name: string;
  prompt: string;
  phone_number: string;
  instance_name: string;
  status: number;
  created_at: string;
  updated_at: string;
  empresa_id: number;
  empresa_name?: string;
  upsert_lead: boolean;
  translations?: any;
  search?: boolean;
  search_data?: any;
  validate?: boolean;
  validate_data?: any;
  custom_properties_schema?: any;
  evolution_status?: string;
}

export interface FollowUpSetting {
  id: number;
  order: number;
  message: string;
  time: number;
  agent_id: number;
  agent_name?: string;
  active: boolean;
  created_at: string;
}

export type LeadStatus = 'NOVO' | 'HUMANO' | 'FINALIZADO' | 'CONCLUIDO' | 'CANCELADO';

export interface Lead {
  id: number;
  agent_id: number;
  agent_name?: string;
  remote_jid_alt: string;
  name: string | null;
  custom_properties: Record<string, any> | null;
  status: LeadStatus;
  taken_over_at: string | null;
  take_over_expires_at: string | null;
  updated_at: string | null;
  created_at: string;
  taken_motive: string | null;
  value: number | null;
  lastmessage: string | null;
  follow_up_id: number | null;
  follow_up_message?: string;
  session_id?: string | null;
  pessoa_id?: number | null;
  finalized_by?: number | null;
  finalized_by_name?: string;
}

export interface Pessoa {
  id: number;
  name: string;
  phone: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: number | string;
  sessionId?: string;
  content: string;
  role?: string;
  source?: string;
  createdAt: string;
  remoteJid?: string;
  rawMessage?: any;
  quoted_message_text?: string;
  messageType?: string;
  messageId?: string;
}

export interface HistoryResponse {
  source: string;
  tableName?: string;
  messages: ChatMessage[];
}

export const api = {
  // Empresas
  getPublicEmpresa: (base64Id: string) => request<Empresa>(`/api/empresas/public/${base64Id}`),
  getEmpresas: () => request<Empresa[]>('/api/empresas'),
  createEmpresa: (data: Partial<Empresa>) => request<Empresa>('/api/empresas', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateEmpresa: (id: number, data: Partial<Empresa>) => request<Empresa>(`/api/empresas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteEmpresa: (id: number) => request<{ message: string }>(`/api/empresas/${id}`, {
    method: 'DELETE',
  }),

  // Agents
  getAgents: () => request<Agent[]>('/api/agents'),
  createAgent: (data: Partial<Agent>) => request<Agent>('/api/agents', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateAgent: (id: number, data: Partial<Agent>) => request<Agent>(`/api/agents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteAgent: (id: number) => request<{ message: string }>(`/api/agents/${id}`, {
    method: 'DELETE',
  }),

  // Follow-up Settings
  getFollowUps: () => request<FollowUpSetting[]>('/api/follow-up-settings'),
  createFollowUp: (data: Partial<FollowUpSetting>) => request<FollowUpSetting>('/api/follow-up-settings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateFollowUp: (id: number, data: Partial<FollowUpSetting>) => request<FollowUpSetting>(`/api/follow-up-settings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteFollowUp: (id: number) => request<{ message: string }>(`/api/follow-up-settings/${id}`, {
    method: 'DELETE',
  }),

  // Leads
  getLeads: (empresa?: string, agente?: string, search?: string, page?: number, pageSize?: number, status?: string, month?: string) => {
    const params = new URLSearchParams();
    if (empresa) params.append('empresa', empresa);
    if (agente) params.append('agente', agente);
    if (search) params.append('search', search);
    if (page) params.append('page', String(page));
    if (pageSize) params.append('pageSize', String(pageSize));
    if (status) params.append('status', status);
    if (month) params.append('month', month);
    return request<{ data: Lead[]; total: number }>(`/api/leads?${params.toString()}`);
  },
  getLeadsSummary: (empresa?: string, agente?: string, search?: string, month?: string) => {
    const params = new URLSearchParams();
    if (empresa) params.append('empresa', empresa);
    if (agente) params.append('agente', agente);
    if (search) params.append('search', search);
    if (month) params.append('month', month);
    return request<Record<string, { total: number; value: number }>>(`/api/leads/summary?${params.toString()}`);
  },
  getLeadById: (id: number) => request<Lead>(`/api/leads/${id}`),
  getLeadAvatar: (leadId: number) => request<{ url: string | null }>(`/api/leads/${leadId}/avatar`),
  getBulkAvatars: (ids: number[]) => request<Record<number, string | null>>(`/api/leads/avatars?ids=${ids.join(',')}`),
  createLead: (data: Partial<Lead>) => request<Lead>('/api/leads', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateLead: (id: number, data: Partial<Lead>) => request<Lead>(`/api/leads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteLead: (id: number) => request<{ message: string }>(`/api/leads/${id}`, {
    method: 'DELETE',
  }),

  // Pessoas
  getPessoas: () => request<Pessoa[]>('/api/pessoas'),
  getPessoaById: (id: number) => request<Pessoa>(`/api/pessoas/${id}`),
  createPessoa: (data: Partial<Pessoa>) => request<Pessoa>('/api/pessoas', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updatePessoa: (id: number, data: Partial<Pessoa>) => request<Pessoa>(`/api/pessoas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deletePessoa: (id: number) => request<{ message: string }>(`/api/pessoas/${id}`, {
    method: 'DELETE',
  }),
  getLeadsByPessoaId: (id: number) => request<Lead[]>(`/api/pessoas/${id}/leads`),

  sendPresence: (leadId: number, presence: 'composing' | 'recording') => request<any>(`/api/leads/${leadId}/presence`, {
    method: 'POST',
    body: JSON.stringify({ presence }),
  }),

  // Messages History
  getAgentHistory: (agentId: number) => request<HistoryResponse>(`/api/agents/${agentId}/history`),
  getLeadHistory: (leadId: number) => request<HistoryResponse>(`/api/leads/${leadId}/history`),
  getLeadAgentHistory: (leadId: number) => request<HistoryResponse>(`/api/leads/${leadId}/agent-history`),
  getMessageMedia: (messageId: number | string) => request<{ base64: string }>(`/api/messages/${messageId}/media`),
  sendLeadMessage: (leadId: number, text: string, options?: { messageType?: string; mediaBase64?: string; fileName?: string; quotedMessageId?: number | string }) => request<any>(`/api/leads/${leadId}/send-message`, {
    method: 'POST',
    body: JSON.stringify({ message: text, ...options })
  }),

  // Evolution API
  getEvolutionInstances: () => request<any[]>('/api/evolution/instances'),
  getEvolutionConnectionState: (instanceName: string) => request<any>(`/api/evolution/connection-state/${instanceName}`),
  connectEvolutionInstance: (instanceName: string) => request<any>(`/api/evolution/connect/${instanceName}`),
  getMediaByWhatsAppId: (instanceName: string, messageId: string) => request<{ base64: string }>(`/api/media/${instanceName}/${messageId}`),

  // Auth
  updateMyAvatar: (avatar: string | null) => request<{ avatar: string | null }>('/api/auth/avatar', {
    method: 'PUT',
    body: JSON.stringify({ avatar }),
  }),
  login: (data: any) => request<{ token: string; must_change_password: boolean; user: any }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  changePassword: (data: { currentPassword: string; newPassword: string }) => request<{ message: string }>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  logout: () => request<{ message: string }>('/api/auth/logout', {
    method: 'POST',
  }),
  getMe: () => request<any>('/api/auth/me'),

  // Users
  getUsers: () => request<User[]>('/api/users'),
  createUser: (data: Partial<User>) => request<User>('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateUser: (id: number, data: Partial<User>) => request<User>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteUser: (id: number) => request<{ message: string }>(`/api/users/${id}`, {
    method: 'DELETE',
  }),
  resetUserPassword: (id: number, newPassword: string) => request<{ message: string }>(`/api/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  }),
};

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'superadmin' | 'manager' | 'employee';
  empresa_id?: number | null;
  active: boolean;
  password?: string;
  created_at?: string;
}
