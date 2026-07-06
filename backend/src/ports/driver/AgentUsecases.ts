import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';
import { Agent } from '../../domain/entities/Agent';

export interface AgentUsecases {
  getAgents(user: UserSession): Promise<Agent[]>;
  createAgent(user: UserSession, agent: Omit<Agent, 'id'>): Promise<Agent>;
  updateAgent(user: UserSession, id: number, agent: Partial<Agent>): Promise<Agent>;
  deleteAgent(user: UserSession, id: number): Promise<boolean>;
}
