import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';
import { User } from '../../domain/entities/User';

export interface LoginResponse {
  token: string;
  must_change_password: boolean;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    empresa_id?: number | null;
    empresa_name?: string | null;
    empresa_logo?: string | null;
    avatar?: string | null;
  };
}

export interface UserUsecases {
  getUsers(user: UserSession): Promise<User[]>;
  getUserById(user: UserSession, id: number): Promise<User | null>;
  createUser(user: UserSession, userData: Omit<User, 'id'>): Promise<User>;
  updateUser(user: UserSession, id: number, userData: Partial<User>): Promise<User>;
  deleteUser(user: UserSession, id: number): Promise<boolean>;
  login(email: string, password: string, empresaId?: number, ip?: string | null, deviceInfo?: string | null): Promise<LoginResponse>;
  changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void>;
  resetUserPassword(adminUser: UserSession, targetUserId: number, newPassword: string): Promise<void>;
  updateAvatar(user: UserSession, avatarBase64: string | null): Promise<User>;
  logout(sessionToken: string): Promise<void>;
}
