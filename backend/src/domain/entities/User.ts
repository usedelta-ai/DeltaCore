export interface User {
  id?: number;
  name: string;
  email: string;
  password: string; // Senha criptografada
  role: 'superadmin' | 'manager' | 'employee';
  empresa_id?: number | null;
  active: boolean;
  created_at?: Date;
  updated_at?: Date;
}
