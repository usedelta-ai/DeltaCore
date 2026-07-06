import { AgentUsecases } from '../../ports/driver/AgentUsecases';
import { DBPort } from '../../ports/driven/DBPort';
import { EvolutionAPIPort } from '../../ports/driven/EvolutionAPIPort';
import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';
import { Agent } from '../entities/Agent';

export class AgentUsecasesImpl implements AgentUsecases {
  constructor(
    private db: DBPort,
    private evolution: EvolutionAPIPort
  ) {}

  private checkWritePermission(user: UserSession) {
    if (user.role === 'employee') {
      throw new Error('Unauthorized: Employees cannot make modifications to configurations');
    }
  }

  private checkCompanyAccess(user: UserSession, resourceCompanyId: number) {
    if (user.role !== 'superadmin' && user.companyId !== resourceCompanyId) {
      throw new Error('Unauthorized: You do not have access to this company\'s resources');
    }
  }

  async getAgents(user: UserSession): Promise<Agent[]> {
    const agents = await this.db.getAgents(user.role === 'superadmin' ? undefined : user.companyId);

    let evolutionInstances: any[] = [];
    try {
      evolutionInstances = await this.evolution.fetchInstances();
    } catch (_) {}

    return agents.map((agent) => {
      const matched = evolutionInstances.find((inst: any) => {
        const instName = inst.instanceName || inst.name || inst.instance?.instanceName || inst.instance?.name || '';
        return instName.toLowerCase() === agent.instance_name?.toLowerCase();
      });
      agent.evolution_status = matched?.connectionStatus || matched?.instance?.connectionStatus || matched?.status || matched?.instance?.status || 'desconectado';
      return agent;
    });
  }

  async createAgent(user: UserSession, agent: Omit<Agent, 'id'>): Promise<Agent> {
    this.checkWritePermission(user);
    this.checkCompanyAccess(user, agent.empresa_id);
    return this.db.createAgent(agent);
  }

  async updateAgent(user: UserSession, id: number, agent: Partial<Agent>): Promise<Agent> {
    this.checkWritePermission(user);
    const existing = await this.db.getAgentById(id);
    if (!existing) throw new Error('Agent not found');
    this.checkCompanyAccess(user, existing.empresa_id);

    if (agent.empresa_id !== undefined) {
      this.checkCompanyAccess(user, agent.empresa_id);
    }
    return this.db.updateAgent(id, agent);
  }

  async deleteAgent(user: UserSession, id: number): Promise<boolean> {
    this.checkWritePermission(user);
    const existing = await this.db.getAgentById(id);
    if (!existing) throw new Error('Agent not found');
    this.checkCompanyAccess(user, existing.empresa_id);
    return this.db.deleteAgent(id);
  }
}
