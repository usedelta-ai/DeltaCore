import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';
import { Pessoa } from '../../domain/entities/Pessoa';
import { Lead } from '../../domain/entities/Lead';

export interface PessoaUsecases {
  getPessoas(user: UserSession): Promise<Pessoa[]>;
  getPessoaById(user: UserSession, id: number): Promise<Pessoa | null>;
  createPessoa(user: UserSession, pessoa: Omit<Pessoa, 'id'>): Promise<Pessoa>;
  updatePessoa(user: UserSession, id: number, pessoa: Partial<Pessoa>): Promise<Pessoa>;
  deletePessoa(user: UserSession, id: number): Promise<boolean>;
  getLeadsByPessoaId(user: UserSession, pessoaId: number): Promise<Lead[]>;
}
