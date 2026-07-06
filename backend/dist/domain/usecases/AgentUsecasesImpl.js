"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentUsecasesImpl = void 0;
class AgentUsecasesImpl {
    db;
    evolution;
    constructor(db, evolution) {
        this.db = db;
        this.evolution = evolution;
    }
    checkWritePermission(user) {
        if (user.role === 'employee') {
            throw new Error('Unauthorized: Employees cannot make modifications to configurations');
        }
    }
    checkCompanyAccess(user, resourceCompanyId) {
        if (user.role !== 'superadmin' && user.companyId !== resourceCompanyId) {
            throw new Error('Unauthorized: You do not have access to this company\'s resources');
        }
    }
    async getAgents(user) {
        const agents = await this.db.getAgents(user.role === 'superadmin' ? undefined : user.companyId);
        let evolutionInstances = [];
        try {
            evolutionInstances = await this.evolution.fetchInstances();
        }
        catch (_) { }
        return agents.map((agent) => {
            const matched = evolutionInstances.find((inst) => {
                const instName = inst.instanceName || inst.name || inst.instance?.instanceName || inst.instance?.name || '';
                return instName.toLowerCase() === agent.instance_name?.toLowerCase();
            });
            agent.evolution_status = matched?.connectionStatus || matched?.instance?.connectionStatus || matched?.status || matched?.instance?.status || 'desconectado';
            return agent;
        });
    }
    async createAgent(user, agent) {
        this.checkWritePermission(user);
        this.checkCompanyAccess(user, agent.empresa_id);
        return this.db.createAgent(agent);
    }
    async updateAgent(user, id, agent) {
        this.checkWritePermission(user);
        const existing = await this.db.getAgentById(id);
        if (!existing)
            throw new Error('Agent not found');
        this.checkCompanyAccess(user, existing.empresa_id);
        if (agent.empresa_id !== undefined) {
            this.checkCompanyAccess(user, agent.empresa_id);
        }
        return this.db.updateAgent(id, agent);
    }
    async deleteAgent(user, id) {
        this.checkWritePermission(user);
        const existing = await this.db.getAgentById(id);
        if (!existing)
            throw new Error('Agent not found');
        this.checkCompanyAccess(user, existing.empresa_id);
        return this.db.deleteAgent(id);
    }
}
exports.AgentUsecasesImpl = AgentUsecasesImpl;
