import { LeadUsecases } from '../../ports/driver/LeadUsecases';
import { DBPort } from '../../ports/driven/DBPort';
import { EvolutionAPIPort } from '../../ports/driven/EvolutionAPIPort';
import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';
import { Lead, isValidLeadStatus } from '../entities/Lead';

export class LeadUsecasesImpl implements LeadUsecases {
  constructor(
    private db: DBPort,
    private evolution: EvolutionAPIPort
  ) {}

  private async checkCompanyAccessByAgent(user: UserSession, agentId: number) {
    if (user.role !== 'superadmin') {
      const agent = await this.db.getAgentById(agentId);
      if (!agent || agent.empresa_id !== user.companyId) {
        throw new Error('Unauthorized: You do not have access to this company\'s resources');
      }
    }
  }

  async getLeads(user: UserSession, filters?: { empresaId?: number; agentId?: number; search?: string; page?: number; pageSize?: number; status?: string; month?: string }): Promise<{ data: Lead[]; total: number }> {
    const companyId = user.role === 'superadmin' ? filters?.empresaId : user.companyId;
    return this.db.getLeads(companyId, filters?.agentId, { search: filters?.search, page: filters?.page, pageSize: filters?.pageSize, status: filters?.status, month: filters?.month });
  }

  async getLeadsSummary(user: UserSession, filters?: { empresaId?: number; agentId?: number; search?: string; month?: string }): Promise<Record<string, { total: number; value: number }>> {
    const companyId = user.role === 'superadmin' ? filters?.empresaId : user.companyId;
    return this.db.getLeadsSummary(companyId, filters?.agentId, filters?.search, filters?.month);
  }

  async getLeadById(user: UserSession, id: number): Promise<Lead | null> {
    const lead = await this.db.getLeadById(id);
    if (!lead) return null;
    if (user.role !== 'superadmin') {
      const agent = await this.db.getAgentById(lead.agent_id);
      if (!agent || agent.empresa_id !== user.companyId) {
        throw new Error('Unauthorized: You do not have access to this company\'s resources');
      }
    }
    return lead;
  }

  async createLead(user: UserSession, lead: Omit<Lead, 'id'>): Promise<Lead> {
    if (lead.status && !isValidLeadStatus(lead.status)) {
      throw new Error(`Invalid status "${lead.status}". Allowed: NOVO, HUMANO, FINALIZADO, CONCLUIDO, CANCELADO`);
    }
    await this.checkCompanyAccessByAgent(user, lead.agent_id);
    return this.db.createLead(lead);
  }

  async updateLead(user: UserSession, id: number, lead: Partial<Lead>): Promise<Lead> {
    if (lead.status && !isValidLeadStatus(lead.status)) {
      throw new Error(`Invalid status "${lead.status}". Allowed: NOVO, HUMANO, FINALIZADO, CONCLUIDO, CANCELADO`);
    }
    const existing = await this.db.getLeadById(id);
    if (!existing) throw new Error('Lead not found');
    await this.checkCompanyAccessByAgent(user, existing.agent_id);

    if (lead.agent_id !== undefined) {
      await this.checkCompanyAccessByAgent(user, lead.agent_id);
    }

    if (lead.status !== undefined) {
      if (lead.status === 'FINALIZADO' || lead.status === 'CONCLUIDO') {
        lead.finalized_by = user.userId;
      } else {
        lead.finalized_by = null;
      }
    }
    
    const updated = await this.db.updateLead(id, lead);

    // Mapeia e insere as mudanças de campos na tabela lead_history
    const fieldsToTrack: (keyof Lead)[] = ['status', 'value', 'agent_id', 'name'];
    for (const field of fieldsToTrack) {
      if (lead[field] !== undefined && String(lead[field]) !== String(existing[field])) {
        try {
          await this.db.insertLeadHistoryLog({
            lead_id: id,
            user_id: user.userId,
            agent_id: existing.agent_id,
            changed_by_agent: false,
            field_name: field,
            old_value: existing[field] ? String(existing[field]) : null,
            new_value: lead[field] ? String(lead[field]) : null
          });
        } catch (e) {
          console.error(`Erro ao salvar log de histórico de alteração do lead:`, e);
        }
      }
    }

    // Compara e registra alterações de custom_properties
    if (lead.custom_properties !== undefined && lead.custom_properties !== null) {
      const oldProps = (existing.custom_properties || {}) as Record<string, any>;
      const newProps = (lead.custom_properties || {}) as Record<string, any>;
      const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

      for (const key of allKeys) {
        const oldVal = oldProps[key];
        const newVal = newProps[key];
        if (String(oldVal) !== String(newVal)) {
          try {
            await this.db.insertLeadHistoryLog({
              lead_id: id,
              user_id: user.userId,
              agent_id: existing.agent_id,
              changed_by_agent: false,
              field_name: `custom_properties.${key}`,
              old_value: oldVal !== undefined && oldVal !== null ? String(oldVal) : null,
              new_value: newVal !== undefined && newVal !== null ? String(newVal) : null
            });
          } catch (e) {
            console.error(`Erro ao salvar log de custom_properties no histórico:`, e);
          }
        }
      }
    }

    return updated;
  }

  async deleteLead(user: UserSession, id: number): Promise<boolean> {
    const existing = await this.db.getLeadById(id);
    if (!existing) throw new Error('Lead not found');
    await this.checkCompanyAccessByAgent(user, existing.agent_id);
    return this.db.deleteLead(id);
  }

  async getBulkAvatars(user: UserSession, ids: number[]): Promise<Record<number, string | null>> {
    if (ids.length === 0) return {};
    const leads = await this.db.getLeadsByIds(ids);
    const result: Record<number, string | null> = {};
    for (const id of ids) result[id] = null;

    const agentCache = new Map<number, { instance_name: string; empresa_id: number } | null>();
    const fetchQueue: { leadId: number; instanceName: string; phone: string }[] = [];

    for (const lead of leads) {
      if (!lead || lead.id === undefined) continue;
      if (user.role !== 'superadmin') {
        if (!agentCache.has(lead.agent_id)) {
          const agent = await this.db.getAgentById(lead.agent_id);
          agentCache.set(lead.agent_id, agent);
        }
        const ag = agentCache.get(lead.agent_id);
        if (!ag || ag.empresa_id !== user.companyId) continue;
      }
      let phone = lead.remote_jid_alt;
      if (phone.includes('@')) phone = phone.split('@')[0];

      const agent = agentCache.get(lead.agent_id) || await this.db.getAgentById(lead.agent_id);
      if (!agent?.instance_name) continue;
      agentCache.set(lead.agent_id, agent);
      fetchQueue.push({ leadId: lead.id, instanceName: agent.instance_name, phone });
    }

    const seen = new Set<string>();
    const deduped = fetchQueue.filter(f => {
      const key = `${f.instanceName}:${f.phone}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const picResults = await Promise.allSettled(
      deduped.map(f =>
        this.evolution.fetchProfilePictureUrl(f.instanceName, f.phone)
          .then(r => ({ leadIds: fetchQueue.filter(q => q.instanceName === f.instanceName && q.phone === f.phone).map(q => q.leadId), url: r?.profilePictureUrl || null }))
          .catch(() => ({ leadIds: fetchQueue.filter(q => q.instanceName === f.instanceName && q.phone === f.phone).map(q => q.leadId), url: null }))
      )
    );

    for (const settled of picResults) {
      if (settled.status === 'fulfilled' && settled.value.url) {
        for (const lid of settled.value.leadIds) {
          result[lid] = settled.value.url;
        }
      }
    }

    return result;
  }

  async getLeadAvatar(user: UserSession, id: number): Promise<string | null> {
    const lead = await this.db.getLeadById(id);
    if (!lead) return null;

    if (user.role !== 'superadmin') {
      const agent = await this.db.getAgentById(lead.agent_id);
      if (!agent || agent.empresa_id !== user.companyId) {
        throw new Error('Unauthorized: You do not have access to this company\'s resources');
      }
    }

    const agent = await this.db.getAgentById(lead.agent_id);
    if (!agent || !agent.instance_name) return null;

    try {
      let number = lead.remote_jid_alt;
      if (number.includes('@')) {
        number = number.split('@')[0];
      }
      
      const response = await this.evolution.fetchProfilePictureUrl(agent.instance_name, number);
      return response?.profilePictureUrl || null;
    } catch (err) {
      console.warn(`Could not fetch profile picture for lead ${id} from Evolution:`, err);
      return null;
    }
  }
}
