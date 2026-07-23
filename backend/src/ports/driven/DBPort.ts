import { Empresa } from '../../domain/entities/Empresa';
import { Agent } from '../../domain/entities/Agent';
import { Lead } from '../../domain/entities/Lead';
import { FollowUpSetting, ChatMessage } from '../../domain/entities/FollowUp';
import { User, UserSession } from '../../domain/entities/User';
import { Pessoa } from '../../domain/entities/Pessoa';

export interface DBPort {
  // Empresas
  getEmpresas(companyId?: number): Promise<Empresa[]>;
  createEmpresa(name: string, logo: string | null): Promise<Empresa>;
  updateEmpresa(id: number, name: string, logo?: string | null): Promise<Empresa>;
  deleteEmpresa(id: number): Promise<boolean>;

  // Agents
  getAgents(companyId?: number): Promise<Agent[]>;
  getAgentById(id: number): Promise<Agent | null>;
  createAgent(agent: Omit<Agent, 'id'>): Promise<Agent>;
  updateAgent(id: number, agent: Partial<Agent>): Promise<Agent>;
  deleteAgent(id: number): Promise<boolean>;

  // Follow-up settings
  getFollowUpSettings(companyId?: number): Promise<FollowUpSetting[]>;
  createFollowUpSetting(setting: Omit<FollowUpSetting, 'id'>): Promise<FollowUpSetting>;
  updateFollowUpSetting(id: number, setting: Partial<FollowUpSetting>): Promise<FollowUpSetting>;
  deleteFollowUpSetting(id: number): Promise<boolean>;

  // Leads
  getLeads(companyId?: number, agentId?: number, filters?: { search?: string; page?: number; pageSize?: number; status?: string; month?: string }): Promise<{ data: Lead[]; total: number }>;
  getLeadsSummary(companyId?: number, agentId?: number, search?: string, month?: string): Promise<Record<string, { total: number; value: number }>>;
  getLeadById(id: number): Promise<Lead | null>;
  getLeadsByIds(ids: number[]): Promise<Lead[]>;
  createLead(lead: Omit<Lead, 'id'>): Promise<Lead>;
  updateLead(id: number, lead: Partial<Lead>): Promise<Lead>;
  deleteLead(id: number): Promise<boolean>;

  // Messages / History
  checkTableExists(tableName: string): Promise<boolean>;
  getDynamicTableMessages(tableName: string, sessionId?: string): Promise<any[]>;
  getStandardMessages(agentId: number): Promise<ChatMessage[]>;
  getLeadStandardMessages(sessionId: string): Promise<ChatMessage[]>;
  getMessageById(id: number): Promise<any>;
  createMessage(message: {
    agent_id: number;
    session_id: string;
    content: string;
    role: string;
    source: string;
    remote_jid: string;
    message_type: string;
    message_id: string;
    quote_message_content?: string;
    user_id?: number;
  }): Promise<any>;

  // Users
  getUsers(companyId?: number): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: number): Promise<User | null>;
  createUser(user: Omit<User, 'id'>): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
  updateUserPassword(userId: number, newPasswordHash: string): Promise<void>;

  // User Sessions
  createSession(session: Omit<UserSession, 'id'>): Promise<UserSession>;
  getSessionByToken(token: string): Promise<UserSession | null>;
  revokeUserSessions(userId: number): Promise<void>;
  revokeSession(sessionId: number): Promise<void>;
  updateSessionActivity(sessionId: number): Promise<void>;
  getActiveSessionsByUserId(userId: number): Promise<UserSession[]>;

  // Lead History log
  getLeadHistoryChanges(leadId: number): Promise<any[]>;
  insertLeadHistoryLog(log: {
    lead_id: number;
    user_id?: number | null;
    agent_id?: number | null;
    changed_by_agent: boolean;
    field_name: string;
    old_value: string | null;
    new_value: string | null;
  }): Promise<void>;

  // Pessoas
  getPessoas(): Promise<Pessoa[]>;
  getPessoaById(id: number): Promise<Pessoa | null>;
  getPessoaByPhone(phone: string): Promise<Pessoa | null>;
  createPessoa(pessoa: Omit<Pessoa, 'id'>): Promise<Pessoa>;
  updatePessoa(id: number, pessoa: Partial<Pessoa>): Promise<Pessoa>;
  deletePessoa(id: number): Promise<boolean>;
  getLeadsByPessoaId(pessoaId: number): Promise<Lead[]>;
  getLeadsByPhone(phone: string): Promise<Lead[]>;
}
