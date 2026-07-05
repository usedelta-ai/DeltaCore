export interface Lead {
  id?: number;
  agent_id: number;
  remote_jid_alt: string;
  name: string;
  custom_properties?: string | Record<string, any> | null;
  status: string;
  taken_over_at?: Date | null;
  take_over_expires_at?: Date | null;
  taken_motive?: string | null;
  value?: string | null;
  lastmessage?: string | null;
  follow_up_id?: number | null;
  session_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
  agent_name?: string;
  agent_status?: number;
  follow_up_message?: string;
}
