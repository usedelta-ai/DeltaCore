import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';
import { Empresa } from '../../domain/entities/Empresa';
import { Agent } from '../../domain/entities/Agent';
import { Lead } from '../../domain/entities/Lead';
import { FollowUpSetting, ChatMessage } from '../../domain/entities/FollowUp';

export interface Usecases {
  // Empresas
  getEmpresas(user: UserSession): Promise<Empresa[]>;
  createEmpresa(user: UserSession, name: string, logo: string | null): Promise<Empresa>;
  updateEmpresa(user: UserSession, id: number, name: string, logo?: string | null): Promise<Empresa>;
  deleteEmpresa(user: UserSession, id: number): Promise<boolean>;

  // Agents
  getAgents(user: UserSession): Promise<Agent[]>;
  createAgent(user: UserSession, agent: Omit<Agent, 'id'>): Promise<Agent>;
  updateAgent(user: UserSession, id: number, agent: Partial<Agent>): Promise<Agent>;
  deleteAgent(user: UserSession, id: number): Promise<boolean>;

  // Follow Up Settings
  getFollowUpSettings(user: UserSession): Promise<FollowUpSetting[]>;
  createFollowUpSetting(user: UserSession, setting: Omit<FollowUpSetting, 'id'>): Promise<FollowUpSetting>;
  updateFollowUpSetting(user: UserSession, id: number, setting: Partial<FollowUpSetting>): Promise<FollowUpSetting>;
  deleteFollowUpSetting(user: UserSession, id: number): Promise<boolean>;

  // Leads
  getLeads(user: UserSession): Promise<Lead[]>;
  createLead(user: UserSession, lead: Omit<Lead, 'id'>): Promise<Lead>;
  updateLead(user: UserSession, id: number, lead: Partial<Lead>): Promise<Lead>;
  deleteLead(user: UserSession, id: number): Promise<boolean>;

  // Messages / Chat History
  getAgentHistory(user: UserSession, agentId: number): Promise<any>;
  getLeadHistory(user: UserSession, leadId: number): Promise<any>;
  getMessageMedia(user: UserSession, messageId: number): Promise<any>;

  // Evolution API
  getEvolutionInstances(user: UserSession): Promise<any[]>;
  getEvolutionConnectionState(user: UserSession, instanceName: string): Promise<any>;
  connectEvolution(user: UserSession, instanceName: string): Promise<any>;
}
