"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowUpUsecasesImpl = void 0;
class FollowUpUsecasesImpl {
    db;
    constructor(db) {
        this.db = db;
    }
    checkWritePermission(user) {
        if (user.role === 'employee') {
            throw new Error('Unauthorized: Employees cannot make modifications to configurations');
        }
    }
    async checkCompanyAccessByAgent(user, agentId) {
        if (user.role !== 'superadmin') {
            const agent = await this.db.getAgentById(agentId);
            if (!agent || agent.empresa_id !== user.companyId) {
                throw new Error('Unauthorized: You do not have access to this company\'s resources');
            }
        }
    }
    async getFollowUpSettings(user) {
        return this.db.getFollowUpSettings(user.role === 'superadmin' ? undefined : user.companyId);
    }
    async createFollowUpSetting(user, setting) {
        this.checkWritePermission(user);
        await this.checkCompanyAccessByAgent(user, setting.agent_id);
        return this.db.createFollowUpSetting(setting);
    }
    async updateFollowUpSetting(user, id, setting) {
        this.checkWritePermission(user);
        if (setting.agent_id !== undefined) {
            await this.checkCompanyAccessByAgent(user, setting.agent_id);
        }
        return this.db.updateFollowUpSetting(id, setting);
    }
    async deleteFollowUpSetting(user, id) {
        this.checkWritePermission(user);
        return this.db.deleteFollowUpSetting(id);
    }
}
exports.FollowUpUsecasesImpl = FollowUpUsecasesImpl;
