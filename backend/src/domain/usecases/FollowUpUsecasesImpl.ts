import { FollowUpUsecases } from '../../ports/driver/FollowUpUsecases';
import { DBPort } from '../../ports/driven/DBPort';
import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';
import { FollowUpSetting } from '../entities/FollowUp';

export class FollowUpUsecasesImpl implements FollowUpUsecases {
  constructor(private db: DBPort) {}

  private checkWritePermission(user: UserSession) {
    if (user.role === 'employee') {
      throw new Error('Unauthorized: Employees cannot make modifications to configurations');
    }
  }

  private async checkCompanyAccessByAgent(user: UserSession, agentId: number) {
    if (user.role !== 'superadmin') {
      const agent = await this.db.getAgentById(agentId);
      if (!agent || agent.empresa_id !== user.companyId) {
        throw new Error('Unauthorized: You do not have access to this company\'s resources');
      }
    }
  }

  async getFollowUpSettings(user: UserSession): Promise<FollowUpSetting[]> {
    return this.db.getFollowUpSettings(user.role === 'superadmin' ? undefined : user.companyId);
  }

  async createFollowUpSetting(user: UserSession, setting: Omit<FollowUpSetting, 'id'>): Promise<FollowUpSetting> {
    this.checkWritePermission(user);
    await this.checkCompanyAccessByAgent(user, setting.agent_id);
    return this.db.createFollowUpSetting(setting);
  }

  async updateFollowUpSetting(user: UserSession, id: number, setting: Partial<FollowUpSetting>): Promise<FollowUpSetting> {
    this.checkWritePermission(user);
    if (setting.agent_id !== undefined) {
      await this.checkCompanyAccessByAgent(user, setting.agent_id);
    }
    return this.db.updateFollowUpSetting(id, setting);
  }

  async deleteFollowUpSetting(user: UserSession, id: number): Promise<boolean> {
    this.checkWritePermission(user);
    return this.db.deleteFollowUpSetting(id);
  }
}
