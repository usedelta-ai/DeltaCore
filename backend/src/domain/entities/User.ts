export interface User {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: 'superadmin' | 'manager' | 'employee';
  empresa_id?: number | null;
  avatar?: string | null;
  active: boolean;
  must_change_password?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserSession {
  id?: number;
  user_id: number;
  token: string;
  ip_address?: string | null;
  device_info?: string | null;
  created_at?: Date;
  last_activity_at?: Date;
  expires_at?: Date | null;
  is_revoked?: boolean;
}
