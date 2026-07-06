"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadUsecasesImpl = void 0;
class LeadUsecasesImpl {
    db;
    constructor(db) {
        this.db = db;
    }
    async checkCompanyAccessByAgent(user, agentId) {
        if (user.role !== 'superadmin') {
            const agent = await this.db.getAgentById(agentId);
            if (!agent || agent.empresa_id !== user.companyId) {
                throw new Error('Unauthorized: You do not have access to this company\'s resources');
            }
        }
    }
    async getLeads(user, filters) {
        const companyId = user.role === 'superadmin' ? filters?.empresaId : user.companyId;
        return this.db.getLeads(companyId, filters?.agentId);
    }
    async createLead(user, lead) {
        await this.checkCompanyAccessByAgent(user, lead.agent_id);
        return this.db.createLead(lead);
    }
    async updateLead(user, id, lead) {
        const existing = await this.db.getLeadById(id);
        if (!existing)
            throw new Error('Lead not found');
        await this.checkCompanyAccessByAgent(user, existing.agent_id);
        if (lead.agent_id !== undefined) {
            await this.checkCompanyAccessByAgent(user, lead.agent_id);
        }
        return this.db.updateLead(id, lead);
    }
    async deleteLead(user, id) {
        const existing = await this.db.getLeadById(id);
        if (!existing)
            throw new Error('Lead not found');
        await this.checkCompanyAccessByAgent(user, existing.agent_id);
        return this.db.deleteLead(id);
    }
}
exports.LeadUsecasesImpl = LeadUsecasesImpl;
