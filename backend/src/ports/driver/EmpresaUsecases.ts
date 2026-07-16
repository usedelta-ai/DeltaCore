import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';
import { Empresa } from '../../domain/entities/Empresa';

export interface EmpresaUsecases {
  getEmpresas(user: UserSession): Promise<Empresa[]>;
  createEmpresa(user: UserSession, name: string, logo: string | null): Promise<Empresa>;
  updateEmpresa(user: UserSession, id: number, name: string, logo?: string | null): Promise<Empresa>;
  deleteEmpresa(user: UserSession, id: number): Promise<boolean>;
  getPublicEmpresa(base64Id: string): Promise<Empresa>;
}
