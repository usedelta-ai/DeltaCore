import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';
import { User } from '../../domain/entities/User';

export interface UserUsecases {
  getUsers(user: UserSession): Promise<User[]>;
  createUser(user: UserSession, userData: Omit<User, 'id'>): Promise<User>;
  updateUser(user: UserSession, id: number, userData: Partial<User>): Promise<User>;
  deleteUser(user: UserSession, id: number): Promise<boolean>;
  login(email: string, password: string): Promise<{ token: string; user: { id: number; name: string; email: string; role: string; empresa_id?: number | null; empresa_name?: string | null; empresa_logo?: string | null } }>;
}
