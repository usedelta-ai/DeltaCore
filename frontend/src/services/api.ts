const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const BOARD_URL = import.meta.env.VITE_BOARD_URL || '';

export function getBoardUrl(empresaId: number, empresaName: string): string {
  const token = btoa(`${empresaId}|${empresaName}`);
  return `${BOARD_URL}/${token}/board`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${path}`;
  const role = localStorage.getItem('user-role') || 'superadmin';
  const companyId = localStorage.getItem('user-company-id') || '';

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-user-role': role,
    ...options?.headers,
  };

  if (companyId) {
    headers['x-user-company-id'] = companyId;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
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

export interface Lead {
  id: number;
  agent_id: number;
  agent_name?: string;
  remote_jid_alt: string;
  name: string | null;
  custom_properties: Record<string, any> | null;
  status: string;
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
}

export interface ChatMessage {
  id: number;
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
  getLeads: () => request<Lead[]>('/api/leads'),
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

  // Messages History
  getAgentHistory: (agentId: number) => request<HistoryResponse>(`/api/agents/${agentId}/history`),
  getLeadHistory: (leadId: number) => request<HistoryResponse>(`/api/leads/${leadId}/history`),
  getMessageMedia: (messageId: number) => request<{ base64: string }>(`/api/messages/${messageId}/media`),

  // Evolution API
  getEvolutionInstances: () => request<any[]>('/api/evolution/instances'),
  getEvolutionConnectionState: (instanceName: string) => request<any>(`/api/evolution/connection-state/${instanceName}`),
  connectEvolutionInstance: (instanceName: string) => request<any>(`/api/evolution/connect/${instanceName}`),
};
