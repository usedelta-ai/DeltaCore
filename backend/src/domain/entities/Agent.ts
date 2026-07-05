export interface Agent {
  id?: number;
  name: string;
  prompt: string;
  phone_number: string;
  instance_name: string;
  status: number;
  empresa_id: number;
  upsert_lead: boolean;
  translations?: string | Record<string, any> | null;
  search: boolean;
  search_data?: string | Record<string, any> | null;
  validate: boolean;
  validate_data?: string | Record<string, any> | null;
  created_at?: Date;
  updated_at?: Date;
  empresa_name?: string;
  evolution_status?: string;
}
