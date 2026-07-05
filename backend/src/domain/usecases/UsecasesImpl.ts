import { Usecases } from '../../ports/driver/Usecases';
import { DBPort } from '../../ports/driven/DBPort';
import { EvolutionAPIPort } from '../../ports/driven/EvolutionAPIPort';
import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';
import { Empresa } from '../../domain/entities/Empresa';
import { Agent } from '../../domain/entities/Agent';
import { Lead } from '../../domain/entities/Lead';
import { FollowUpSetting, ChatMessage } from '../../domain/entities/FollowUp';

export class UsecasesImpl implements Usecases {
  constructor(
    private db: DBPort,
    private evolution: EvolutionAPIPort
  ) {}

  private checkSuperAdmin(user: UserSession) {
    if (user.role !== 'superadmin') {
      throw new Error('Unauthorized: Requires superadmin role');
    }
  }

  private checkWritePermission(user: UserSession) {
    if (user.role === 'employee') {
      throw new Error('Unauthorized: Employees cannot make modifications to configurations');
    }
  }

  private checkCompanyAccess(user: UserSession, resourceCompanyId: number) {
    if (user.role !== 'superadmin' && user.companyId !== resourceCompanyId) {
      throw new Error('Unauthorized: You do not have access to this company\'s resources');
    }
  }

  // Utilities
  private getAgentTableNames(identifier: string) {
    const sanitized = identifier.toLowerCase().replace(/[^a-z0-9_]/g, '');
    return [
      `n8n_chat_histories_${sanitized}`,
      `n8n_history_${sanitized}`,
    ];
  }

  // ---------------------------------------------------------------------------
  // EMPRESAS
  // ---------------------------------------------------------------------------
  async getEmpresas(user: UserSession): Promise<Empresa[]> {
    if (user.role === 'superadmin') {
      return this.db.getEmpresas();
    }
    if (user.companyId !== undefined) {
      return this.db.getEmpresas(user.companyId);
    }
    return [];
  }

  async createEmpresa(user: UserSession, name: string, logo: string | null): Promise<Empresa> {
    this.checkSuperAdmin(user);
    return this.db.createEmpresa(name, logo);
  }

  async updateEmpresa(user: UserSession, id: number, name: string, logo?: string | null): Promise<Empresa> {
    this.checkSuperAdmin(user);
    return this.db.updateEmpresa(id, name, logo);
  }

  async deleteEmpresa(user: UserSession, id: number): Promise<boolean> {
    this.checkSuperAdmin(user);
    return this.db.deleteEmpresa(id);
  }

  // ---------------------------------------------------------------------------
  // AGENTS
  // ---------------------------------------------------------------------------
  async getAgents(user: UserSession): Promise<Agent[]> {
    const agents = await this.db.getAgents(user.role === 'superadmin' ? undefined : user.companyId);

    // Enriquecer com status do Evolution API
    let evolutionInstances: any[] = [];
    try {
      evolutionInstances = await this.evolution.fetchInstances();
    } catch (_) {}

    return agents.map((agent) => {
      const matched = evolutionInstances.find((inst: any) => {
        const instName = inst.instanceName || inst.name || inst.instance?.instanceName || inst.instance?.name || '';
        return instName.toLowerCase() === agent.instance_name?.toLowerCase();
      });
      agent.evolution_status = matched?.connectionStatus || matched?.instance?.connectionStatus || matched?.status || matched?.instance?.status || 'desconectado';
      return agent;
    });
  }

  async createAgent(user: UserSession, agent: Omit<Agent, 'id'>): Promise<Agent> {
    this.checkWritePermission(user);
    this.checkCompanyAccess(user, agent.empresa_id);
    return this.db.createAgent(agent);
  }

  async updateAgent(user: UserSession, id: number, agent: Partial<Agent>): Promise<Agent> {
    this.checkWritePermission(user);
    const existing = await this.db.getAgentById(id);
    if (!existing) throw new Error('Agent not found');
    this.checkCompanyAccess(user, existing.empresa_id);

    if (agent.empresa_id !== undefined) {
      this.checkCompanyAccess(user, agent.empresa_id);
    }
    return this.db.updateAgent(id, agent);
  }

  async deleteAgent(user: UserSession, id: number): Promise<boolean> {
    this.checkWritePermission(user);
    const existing = await this.db.getAgentById(id);
    if (!existing) throw new Error('Agent not found');
    this.checkCompanyAccess(user, existing.empresa_id);
    return this.db.deleteAgent(id);
  }

  // ---------------------------------------------------------------------------
  // FOLLOW UP SETTINGS
  // ---------------------------------------------------------------------------
  async getFollowUpSettings(user: UserSession): Promise<FollowUpSetting[]> {
    return this.db.getFollowUpSettings(user.role === 'superadmin' ? undefined : user.companyId);
  }

  async createFollowUpSetting(user: UserSession, setting: Omit<FollowUpSetting, 'id'>): Promise<FollowUpSetting> {
    this.checkWritePermission(user);
    const agent = await this.db.getAgentById(setting.agent_id);
    if (!agent) throw new Error('Agent not found');
    this.checkCompanyAccess(user, agent.empresa_id);
    return this.db.createFollowUpSetting(setting);
  }

  async updateFollowUpSetting(user: UserSession, id: number, setting: Partial<FollowUpSetting>): Promise<FollowUpSetting> {
    this.checkWritePermission(user);
    if (setting.agent_id !== undefined) {
      const agent = await this.db.getAgentById(setting.agent_id);
      if (!agent) throw new Error('Agent not found');
      this.checkCompanyAccess(user, agent.empresa_id);
    }
    return this.db.updateFollowUpSetting(id, setting);
  }

  async deleteFollowUpSetting(user: UserSession, id: number): Promise<boolean> {
    this.checkWritePermission(user);
    return this.db.deleteFollowUpSetting(id);
  }

  // ---------------------------------------------------------------------------
  // LEADS
  // ---------------------------------------------------------------------------
  async getLeads(user: UserSession): Promise<Lead[]> {
    return this.db.getLeads(user.role === 'superadmin' ? undefined : user.companyId);
  }

  async createLead(user: UserSession, lead: Omit<Lead, 'id'>): Promise<Lead> {
    const agent = await this.db.getAgentById(lead.agent_id);
    if (!agent) throw new Error('Agent not found');
    this.checkCompanyAccess(user, agent.empresa_id);
    return this.db.createLead(lead);
  }

  async updateLead(user: UserSession, id: number, lead: Partial<Lead>): Promise<Lead> {
    const existing = await this.db.getLeadById(id);
    if (!existing) throw new Error('Lead not found');
    
    const agent = await this.db.getAgentById(existing.agent_id);
    if (!agent) throw new Error('Agent not found for this lead');
    this.checkCompanyAccess(user, agent.empresa_id);

    if (lead.agent_id !== undefined) {
      const newAgent = await this.db.getAgentById(lead.agent_id);
      if (!newAgent) throw new Error('New agent not found');
      this.checkCompanyAccess(user, newAgent.empresa_id);
    }

    return this.db.updateLead(id, lead);
  }

  async deleteLead(user: UserSession, id: number): Promise<boolean> {
    const existing = await this.db.getLeadById(id);
    if (!existing) throw new Error('Lead not found');
    const agent = await this.db.getAgentById(existing.agent_id);
    if (!agent) throw new Error('Agent not found');
    this.checkCompanyAccess(user, agent.empresa_id);
    return this.db.deleteLead(id);
  }

  // ---------------------------------------------------------------------------
  // MESSAGES / CHAT HISTORY
  // ---------------------------------------------------------------------------
  async getAgentHistory(user: UserSession, agentId: number): Promise<any> {
    const agent = await this.db.getAgentById(agentId);
    if (!agent) throw new Error('Agent not found');
    this.checkCompanyAccess(user, agent.empresa_id);

    const possibleTables = this.getAgentTableNames(agent.instance_name || agent.name);
    let dynamicTableName = null;
    for (const tableName of possibleTables) {
      const exists = await this.db.checkTableExists(tableName);
      if (exists) {
        dynamicTableName = tableName;
        break;
      }
    }

    if (dynamicTableName) {
      const rows = await this.db.getDynamicTableMessages(dynamicTableName);
      return {
        source: 'dynamic_n8n_table',
        tableName: dynamicTableName,
        messages: rows.map(row => ({
          id: row.id,
          sessionId: row.session_id || row.session_id_alt,
          content: typeof row.message === 'string' ? row.message : JSON.stringify(row.message),
          rawMessage: row.message,
          createdAt: row.created_at || new Date(),
        })),
      };
    } else {
      const messages = await this.db.getStandardMessages(agentId);
      return {
        source: 'standard_messages_table',
        messages
      };
    }
  }

  async getLeadHistory(user: UserSession, leadId: number): Promise<any> {
    const lead = await this.db.getLeadById(leadId);
    if (!lead) throw new Error('Lead not found');

    const agent = await this.db.getAgentById(lead.agent_id);
    if (!agent) throw new Error('Agent not found for this lead');
    this.checkCompanyAccess(user, agent.empresa_id);

    const possibleTables = this.getAgentTableNames(agent.instance_name || agent.name);
    let dynamicTableName = null;
    for (const tableName of possibleTables) {
      const exists = await this.db.checkTableExists(tableName);
      if (exists) {
        dynamicTableName = tableName;
        break;
      }
    }

    if (dynamicTableName) {
      const sessionSearch = lead.session_id;
      if (!sessionSearch) throw new Error('Lead has no session_id');

      const rows = await this.db.getDynamicTableMessages(dynamicTableName);
      const dynRes = rows.filter(r => r.session_id === sessionSearch);

      const rawAiMessages = dynRes.map(row => {
        let isHuman = false;
        try {
          const raw = typeof row.message === 'string' ? JSON.parse(row.message) : row.message;
          if (raw && typeof raw === 'object' && (raw.type === 'human' || raw.type === 'user')) {
            isHuman = true;
          }
        } catch (_) {}

        return {
          id: row.id,
          sessionId: row.session_id,
          content: typeof row.message === 'string' ? row.message : JSON.stringify(row.message),
          rawMessage: row.message,
          createdAt: row.created_at || null,
          isHuman
        };
      }).filter(msg => !msg.isHuman);

      const userMessages = (await this.db.getLeadStandardMessages(sessionSearch)).filter(row => {
        const role = (row.role || '').toLowerCase();
        const source = (row.source || '').toLowerCase();
        const isAi = role === 'assistant' || role === 'bot' || role === 'ai' || source === 'bot' || source === 'ai';
        if (!isAi) return true;

        const rowContent = (row.content || '').trim();
        if (!rowContent) return false;

        const existsInDynamic = rawAiMessages.some(dynMsg => {
          const dynContent = (dynMsg.content || '').trim();
          return dynContent.includes(rowContent) || rowContent.includes(dynContent);
        });
        return !existsInDynamic;
      });

      let lastMatchIndex = -1;
      const aiMessages = rawAiMessages.map(aiMsg => {
        let userText = '';
        try {
          const raw = typeof aiMsg.rawMessage === 'string' ? JSON.parse(aiMsg.rawMessage) : aiMsg.rawMessage;
          const arr = Array.isArray(raw) ? raw : [raw];
          const userItem = arr.find((x: any) => x.role === 'user' || x.role === 'human');
          if (userItem) userText = userItem.content || '';
        } catch (_) {}

        let matchedCreatedAt = aiMsg.createdAt;
        if (!matchedCreatedAt && userText) {
          const cleanUserText = userText.trim();
          for (let i = lastMatchIndex + 1; i < userMessages.length; i++) {
            if ((userMessages[i].content || '').trim() === cleanUserText) {
              matchedCreatedAt = userMessages[i].createdAt;
              lastMatchIndex = i;
              break;
            }
          }
        }

        let finalCreatedAt: Date;
        if (matchedCreatedAt) {
          finalCreatedAt = new Date(new Date(matchedCreatedAt).getTime() + 1000);
        } else {
          finalCreatedAt = new Date();
        }

        return {
          id: aiMsg.id,
          sessionId: aiMsg.sessionId,
          content: aiMsg.content,
          rawMessage: aiMsg.rawMessage,
          createdAt: finalCreatedAt
        };
      });

      const combined = [...aiMessages, ...userMessages];
      combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      return {
        source: 'dynamic_n8n_table_combined',
        tableName: dynamicTableName,
        messages: combined
      };
    } else {
      if (!lead.session_id) throw new Error('Lead has no session_id');
      const messages = await this.db.getLeadStandardMessages(lead.session_id);
      return {
        source: 'standard_messages_table',
        messages
      };
    }
  }

  async getMessageMedia(user: UserSession, messageId: number): Promise<any> {
    const message = await this.db.getMessageById(messageId);
    if (!message) throw new Error('Message not found');

    const agent = await this.db.getAgentById(message.agent_id);
    if (!agent) throw new Error('Agent not found for this message');
    this.checkCompanyAccess(user, agent.empresa_id);

    const instanceName = agent.instance_name;
    if (!instanceName) throw new Error('Agent has no instance configured');

    return this.evolution.getBase64FromMediaMessage(instanceName, message.message_id);
  }

  // ---------------------------------------------------------------------------
  // EVOLUTION API
  // ---------------------------------------------------------------------------
  async getEvolutionInstances(user: UserSession): Promise<any[]> {
    // Apenas superadmins e managers têm permissão
    if (user.role === 'employee') throw new Error('Unauthorized');
    return this.evolution.fetchInstances();
  }

  async getEvolutionConnectionState(user: UserSession, instanceName: string): Promise<any> {
    if (user.role === 'employee') throw new Error('Unauthorized');
    return this.evolution.connectionState(instanceName);
  }

  async connectEvolution(user: UserSession, instanceName: string): Promise<any> {
    if (user.role === 'employee') throw new Error('Unauthorized');
    return this.evolution.connect(instanceName);
  }
}
