import { UserUsecases } from '../../ports/driver/UserUsecases';
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

  async getUsers(user: UserSession): Promise<User[]> {
    this.checkSuperAdmin(user);
    return this.db.getUsers();
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
      password: hashedPassword
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

  async login(email: string, password: string): Promise<{ token: string; user: { id: number; name: string; email: string; role: string; empresa_id?: number | null; empresa_name?: string | null; empresa_logo?: string | null } }> {
    const user = await this.db.getUserByEmail(email);
    if (!user || !this.verifyPassword(password, user.password)) {
      throw new Error('Invalid email or password');
    }

    let empresaName: string | null = null;
    let empresaLogo: string | null = null;

    if (user.empresa_id) {
      const empresas = await this.db.getEmpresas(user.empresa_id);
      if (empresas && empresas.length > 0) {
        empresaName = empresas[0].name;
        empresaLogo = empresas[0].logo || null;
      }
    }

    const payload = {
      userId: user.id,
      role: user.role,
      companyId: user.empresa_id,
      exp: Date.now() + 1000 * 60 * 60 * 24 // 24 hours
    };

    const token = this.generateJWT(payload);
    return {
      token,
      user: {
        id: user.id!,
        name: user.name,
        email: user.email,
        role: user.role as any,
        empresa_id: user.empresa_id,
        empresa_name: empresaName,
        empresa_logo: empresaLogo
      }
    };
  }
}
