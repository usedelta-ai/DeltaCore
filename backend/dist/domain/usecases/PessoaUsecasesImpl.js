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
        return this.db.createPessoa(pessoa);
    }
    async updatePessoa(user, id, pessoa) {
        return this.db.updatePessoa(id, pessoa);
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
