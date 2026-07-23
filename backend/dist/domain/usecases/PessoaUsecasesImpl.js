"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PessoaUsecasesImpl = void 0;
class PessoaUsecasesImpl {
    db;
    constructor(db) {
        this.db = db;
    }
    async getPessoas(user) {
        return this.db.getPessoas();
    }
    async getPessoaById(user, id) {
        return this.db.getPessoaById(id);
    }
    async createPessoa(user, pessoa) {
        const created = await this.db.createPessoa(pessoa);
        // Auto-link leads by phone number
        try {
            const leads = await this.db.getLeadsByPhone(created.phone);
            for (const lead of leads) {
                if (lead.id) {
                    await this.db.updateLead(lead.id, { pessoa_id: created.id });
                }
            }
        }
        catch (e) {
            console.error('Erro ao auto-vincular leads na criação de pessoa:', e);
        }
        return created;
    }
    async updatePessoa(user, id, pessoa) {
        const updated = await this.db.updatePessoa(id, pessoa);
        // If phone is updated, auto-link leads with the new phone
        if (pessoa.phone) {
            try {
                const leads = await this.db.getLeadsByPhone(updated.phone);
                for (const lead of leads) {
                    if (lead.id) {
                        await this.db.updateLead(lead.id, { pessoa_id: updated.id });
                    }
                }
            }
            catch (e) {
                console.error('Erro ao auto-vincular leads na atualização de pessoa:', e);
            }
        }
        return updated;
    }
    async deletePessoa(user, id) {
        return this.db.deletePessoa(id);
    }
    async getLeadsByPessoaId(user, pessoaId) {
        const leads = await this.db.getLeadsByPessoaId(pessoaId);
        if (user.role !== 'superadmin') {
            const companyId = user.companyId;
            const filteredLeads = [];
            for (const lead of leads) {
                const agent = await this.db.getAgentById(lead.agent_id);
                if (agent && agent.empresa_id === companyId) {
                    filteredLeads.push(lead);
                }
            }
            return filteredLeads;
        }
        return leads;
    }
}
exports.PessoaUsecasesImpl = PessoaUsecasesImpl;
