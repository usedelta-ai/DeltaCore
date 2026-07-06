import { EvolutionUsecases } from '../../ports/driver/EvolutionUsecases';
import { EvolutionAPIPort } from '../../ports/driven/EvolutionAPIPort';
import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';

export class EvolutionUsecasesImpl implements EvolutionUsecases {
  constructor(private evolution: EvolutionAPIPort) {}

  async getEvolutionInstances(user: UserSession): Promise<any[]> {
    if (user.role === 'employee') throw new Error('Unauthorized');
    return this.evolution.fetchInstances();
  }

  async getEvolutionConnectionState(user: UserSession, instanceName: string): Promise<any> {
    if (user.role === 'employee') throw new Error('Unauthorized');
    return this.evolution.connectionState(instanceName);
  }

  async connectEvolution(user: UserSession, instanceName: string): Promise<any> {
    if (user.role === 'employee') throw new Error('Unauthorized');
    return this.evolution.connect(instanceName);
  }

  async getBase64FromMediaMessage(instanceName: string, messageId: string): Promise<any> {
    return this.evolution.getBase64FromMediaMessage(instanceName, messageId);
  }
}
