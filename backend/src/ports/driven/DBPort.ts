import { Empresa } from '../../domain/entities/Empresa';
import { Agent } from '../../domain/entities/Agent';
import { Lead } from '../../domain/entities/Lead';
import { FollowUpSetting, ChatMessage } from '../../domain/entities/FollowUp';
import { User } from '../../domain/entities/User';

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
  getLeads(companyId?: number, agentId?: number): Promise<Lead[]>;
  getLeadById(id: number): Promise<Lead | null>;
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
  }): Promise<any>;

  // Users
  getUsers(companyId?: number): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: Omit<User, 'id'>): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
}
