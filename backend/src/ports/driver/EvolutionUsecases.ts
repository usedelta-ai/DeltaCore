import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';

export interface EvolutionUsecases {
  getEvolutionInstances(user: UserSession): Promise<any[]>;
  getEvolutionConnectionState(user: UserSession, instanceName: string): Promise<any>;
  connectEvolution(user: UserSession, instanceName: string): Promise<any>;
  getBase64FromMediaMessage(instanceName: string, messageId: string): Promise<any>;
}
