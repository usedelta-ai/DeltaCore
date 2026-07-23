import { UserUsecases, LoginResponse } from '../../ports/driver/UserUsecases';
import { DBPort } from '../../ports/driven/DBPort';
import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';
import { User } from '../entities/User';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export class UserUsecasesImpl implements UserUsecases {
  constructor(private db: DBPort) {}

  private getPassKey(): string {
    const key = process.env.PASS_KEY;
    if (!key) {
      throw new Error('PASS_KEY environment variable is not defined');
    }
    return key;
  }

  private checkSuperAdmin(user: UserSession) {
    if (user.role !== 'superadmin') {
      throw new Error('Unauthorized: Requires superadmin role');
    }
  }

  private hashPassword(password: string): string {
    const passKey = this.getPassKey();
    const peppered = crypto.createHmac('sha256', passKey).update(password).digest('hex');
    return bcrypt.hashSync(peppered, 10);
  }

  private verifyPassword(password: string, hash: string): boolean {
    const passKey = this.getPassKey();
    const peppered = crypto.createHmac('sha256', passKey).update(password).digest('hex');
    return bcrypt.compareSync(peppered, hash);
  }

  private generateJWT(payload: any): string {
    const passKey = this.getPassKey();
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', passKey).update(`${header}.${data}`).digest('base64url');
    return `${header}.${data}.${signature}`;
  }

  private generateSessionToken(): string {
    return crypto.randomBytes(48).toString('hex');
  }

  async getUsers(user: UserSession): Promise<User[]> {
    this.checkSuperAdmin(user);
    return this.db.getUsers();
  }

  async getUserById(user: UserSession, id: number): Promise<User | null> {
    return this.db.getUserById(id);
  }

  async createUser(user: UserSession, userData: Omit<User, 'id'>): Promise<User> {
    this.checkSuperAdmin(user);
    const existing = await this.db.getUserByEmail(userData.email);
    if (existing) {
      throw new Error('Email already registered');
    }

    const hashedPassword = this.hashPassword(userData.password);
    return this.db.createUser({
      ...userData,
      password: hashedPassword,
      must_change_password: true,
    });
  }

  async updateUser(user: UserSession, id: number, userData: Partial<User>): Promise<User> {
    this.checkSuperAdmin(user);

    const payload: Partial<User> = { ...userData };
    if (userData.password) {
      payload.password = this.hashPassword(userData.password);
    }

    return this.db.updateUser(id, payload);
  }

  async deleteUser(user: UserSession, id: number): Promise<boolean> {
    this.checkSuperAdmin(user);
    return this.db.deleteUser(id);
  }

  async login(
    email: string,
    password: string,
    empresaId?: number,
    ip?: string | null,
    deviceInfo?: string | null
  ): Promise<LoginResponse> {
    const user = await this.db.getUserByEmail(email);
    if (!user || !this.verifyPassword(password, user.password)) {
      throw new Error('Invalid email or password');
    }

    if (empresaId !== undefined && user.role !== 'superadmin' && user.empresa_id !== empresaId) {
      throw new Error('Acesso não autorizado para esta empresa');
    }

    // Revoke all previous sessions
    await this.db.revokeUserSessions(user.id!);

    // Create new session
    const sessionToken = this.generateSessionToken();
    const session = await this.db.createSession({
      user_id: user.id!,
      token: sessionToken,
      ip_address: ip ?? null,
      device_info: deviceInfo ?? null,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24),
      is_revoked: false,
    });

    let empresaName: string | null = null;
    let empresaLogo: string | null = null;
    const activeEmpresaId = user.empresa_id || empresaId;

    if (activeEmpresaId) {
      const empresas = await this.db.getEmpresas(activeEmpresaId);
      if (empresas && empresas.length > 0) {
        empresaName = empresas[0].name;
        empresaLogo = empresas[0].logo || null;
      }
    }

    const payload = {
      userId: user.id,
      role: user.role,
      companyId: activeEmpresaId,
      sessionId: sessionToken,
      exp: Date.now() + 1000 * 60 * 60 * 24,
    };

    const token = this.generateJWT(payload);
    return {
      token,
      must_change_password: user.must_change_password ?? false,
      user: {
        id: user.id!,
        name: user.name,
        email: user.email,
        role: user.role as any,
        empresa_id: activeEmpresaId,
        empresa_name: empresaName,
        empresa_logo: empresaLogo,
        avatar: user.avatar,
      },
    };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.db.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!this.verifyPassword(currentPassword, user.password)) {
      throw new Error('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new Error('New password must be different from current password');
    }

    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const newHash = this.hashPassword(newPassword);
    await this.db.updateUserPassword(userId, newHash);
  }

  async resetUserPassword(adminUser: UserSession, targetUserId: number, newPassword: string): Promise<void> {
    this.checkSuperAdmin(adminUser);

    const targetUser = await this.db.getUserById(targetUserId);
    if (!targetUser) {
      throw new Error('User not found');
    }

    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const newHash = this.hashPassword(newPassword);
    await this.db.updateUser(targetUserId, {
      password: newHash,
      must_change_password: true,
    });

    await this.db.revokeUserSessions(targetUserId);
  }

  async updateAvatar(user: UserSession, avatarBase64: string | null): Promise<User> {
    if (!user.userId) throw new Error('User not authenticated');

    const updated = await this.db.updateUser(user.userId, { avatar: avatarBase64 });
    return updated;
  }

  async logout(sessionToken: string): Promise<void> {
    const session = await this.db.getSessionByToken(sessionToken);
    if (session && session.id) {
      await this.db.revokeSession(session.id);
    }
  }
}
