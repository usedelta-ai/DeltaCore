import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';
import { Lead } from '../../domain/entities/Lead';

export interface LeadUsecases {
  getLeads(user: UserSession, filters?: { empresaId?: number; agentId?: number; search?: string; page?: number; pageSize?: number; status?: string; month?: string }): Promise<{ data: Lead[]; total: number }>;
  getLeadsSummary(user: UserSession, filters?: { empresaId?: number; agentId?: number; search?: string; month?: string }): Promise<Record<string, { total: number; value: number }>>;
  getLeadById(user: UserSession, id: number): Promise<Lead | null>;
  getBulkAvatars(user: UserSession, ids: number[]): Promise<Record<number, string | null>>;
  createLead(user: UserSession, lead: Omit<Lead, 'id'>): Promise<Lead>;
  updateLead(user: UserSession, id: number, lead: Partial<Lead>): Promise<Lead>;
  deleteLead(user: UserSession, id: number): Promise<boolean>;
  getLeadAvatar(user: UserSession, id: number): Promise<string | null>;
}
