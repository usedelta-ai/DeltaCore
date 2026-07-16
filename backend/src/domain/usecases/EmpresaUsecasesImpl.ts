import { EmpresaUsecases } from '../../ports/driver/EmpresaUsecases';
import { DBPort } from '../../ports/driven/DBPort';
import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';
import { Empresa } from '../entities/Empresa';

export class EmpresaUsecasesImpl implements EmpresaUsecases {
  constructor(private db: DBPort) {}

  private checkSuperAdmin(user: UserSession) {
    if (user.role !== 'superadmin') {
      throw new Error('Unauthorized: Requires superadmin role');
    }
  }

  async getEmpresas(user: UserSession): Promise<Empresa[]> {
    if (user.role === 'superadmin') {
      return this.db.getEmpresas();
    }
    if (user.companyId !== undefined) {
      return this.db.getEmpresas(user.companyId);
    }
    return [];
  }

  async createEmpresa(user: UserSession, name: string, logo: string | null): Promise<Empresa> {
    this.checkSuperAdmin(user);
    return this.db.createEmpresa(name, logo);
  }

  async updateEmpresa(user: UserSession, id: number, name: string, logo?: string | null): Promise<Empresa> {
    this.checkSuperAdmin(user);
    return this.db.updateEmpresa(id, name, logo);
  }

  async deleteEmpresa(user: UserSession, id: number): Promise<boolean> {
    this.checkSuperAdmin(user);
    return this.db.deleteEmpresa(id);
  }

  async getPublicEmpresa(base64Id: string): Promise<Empresa> {
    let companyId: number;
    try {
      const decoded = Buffer.from(base64Id, 'base64').toString('ascii');
      companyId = parseInt(decoded, 10);
      if (isNaN(companyId)) {
        throw new Error('Invalid ID');
      }
    } catch (e) {
      throw new Error('Identificador de empresa inválido');
    }

    const empresas = await this.db.getEmpresas(companyId);
    if (!empresas || empresas.length === 0 || !empresas[0].active) {
      throw new Error('Empresa não encontrada ou inativa');
    }

    return empresas[0];
  }
}
