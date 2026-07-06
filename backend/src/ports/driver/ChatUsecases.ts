import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';

export interface ChatUsecases {
  getAgentHistory(user: UserSession, agentId: number): Promise<any>;
  getLeadHistory(user: UserSession, leadId: number): Promise<any>;
  getLeadAgentHistory(user: UserSession, leadId: number): Promise<any>;
  getMessageMedia(user: UserSession, messageId: number): Promise<any>;
  sendMessage(user: UserSession, leadId: number, content: string, options?: { messageType?: string; mediaBase64?: string; fileName?: string; quotedMessageId?: number }): Promise<any>;
  sendPresence(user: UserSession, leadId: number, presence: 'composing' | 'recording'): Promise<void>;
}
