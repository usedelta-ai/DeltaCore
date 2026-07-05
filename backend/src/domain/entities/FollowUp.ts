export interface FollowUpSetting {
  id?: number;
  order: number;
  message: string;
  time: number;
  agent_id: number;
  active: boolean;
  created_at?: Date;
  agent_name?: string;
}
export interface ChatMessage {
  id: number;
  sessionId?: string;
  content: string;
  role?: string;
  source?: string;
  createdAt: Date;
  remoteJid?: string;
  quoted_message_text?: string;
  messageType?: string;
  messageId?: string;
}
