import { LeadUsecases } from '../../ports/driver/LeadUsecases';
import { DBPort } from '../../ports/driven/DBPort';
import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';
import { Lead } from '../entities/Lead';

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

  async createLead(user: UserSession, lead: Omit<Lead, 'id'>): Promise<Lead> {
    await this.checkCompanyAccessByAgent(user, lead.agent_id);
    return this.db.createLead(lead);
  }

  async updateLead(user: UserSession, id: number, lead: Partial<Lead>): Promise<Lead> {
    const existing = await this.db.getLeadById(id);
    if (!existing) throw new Error('Lead not found');
    await this.checkCompanyAccessByAgent(user, existing.agent_id);

    if (lead.agent_id !== undefined) {
      await this.checkCompanyAccessByAgent(user, lead.agent_id);
    }
    return this.db.updateLead(id, lead);
  }

  async deleteLead(user: UserSession, id: number): Promise<boolean> {
    const existing = await this.db.getLeadById(id);
    if (!existing) throw new Error('Lead not found');
    await this.checkCompanyAccessByAgent(user, existing.agent_id);
    return this.db.deleteLead(id);
  }
}
