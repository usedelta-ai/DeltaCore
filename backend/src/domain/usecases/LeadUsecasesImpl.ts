import { LeadUsecases } from '../../ports/driver/LeadUsecases';
import { DBPort } from '../../ports/driven/DBPort';
import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';
import { Lead, isValidLeadStatus } from '../entities/Lead';

export class LeadUsecasesImpl implements LeadUsecases {
  constructor(private db: DBPort) {}

  private async checkCompanyAccessByAgent(user: UserSession, agentId: number) {
    if (user.role !== 'superadmin') {
      const agent = await this.db.getAgentById(agentId);
      if (!agent || agent.empresa_id !== user.companyId) {
        throw new Error('Unauthorized: You do not have access to this company\'s resources');
      }
    }
  }

  async getLeads(user: UserSession, filters?: { empresaId?: number; agentId?: number }): Promise<Lead[]> {
    const companyId = user.role === 'superadmin' ? filters?.empresaId : user.companyId;
    return this.db.getLeads(companyId, filters?.agentId);
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

    return updated;
  }

  async deleteLead(user: UserSession, id: number): Promise<boolean> {
    const existing = await this.db.getLeadById(id);
    if (!existing) throw new Error('Lead not found');
    await this.checkCompanyAccessByAgent(user, existing.agent_id);
    return this.db.deleteLead(id);
  }
}
