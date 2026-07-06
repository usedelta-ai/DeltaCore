import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';
import { Lead } from '../../domain/entities/Lead';

export interface LeadUsecases {
  getLeads(user: UserSession, filters?: { empresaId?: number; agentId?: number }): Promise<Lead[]>;
  createLead(user: UserSession, lead: Omit<Lead, 'id'>): Promise<Lead>;
  updateLead(user: UserSession, id: number, lead: Partial<Lead>): Promise<Lead>;
  deleteLead(user: UserSession, id: number): Promise<boolean>;
}
