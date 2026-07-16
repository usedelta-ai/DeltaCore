"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadUsecasesImpl = void 0;
const Lead_1 = require("../entities/Lead");
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
    async getLeadById(user, id) {
        const lead = await this.db.getLeadById(id);
        if (!lead)
            return null;
        if (user.role !== 'superadmin') {
            const agent = await this.db.getAgentById(lead.agent_id);
            if (!agent || agent.empresa_id !== user.companyId) {
                throw new Error('Unauthorized: You do not have access to this company\'s resources');
            }
        }
        return lead;
    }
    async createLead(user, lead) {
        if (lead.status && !(0, Lead_1.isValidLeadStatus)(lead.status)) {
            throw new Error(`Invalid status "${lead.status}". Allowed: NOVO, HUMANO, FINALIZADO, CONCLUIDO, CANCELADO`);
        }
        await this.checkCompanyAccessByAgent(user, lead.agent_id);
        return this.db.createLead(lead);
    }
    async updateLead(user, id, lead) {
        if (lead.status && !(0, Lead_1.isValidLeadStatus)(lead.status)) {
            throw new Error(`Invalid status "${lead.status}". Allowed: NOVO, HUMANO, FINALIZADO, CONCLUIDO, CANCELADO`);
        }
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
