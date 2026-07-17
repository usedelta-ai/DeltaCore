import { PessoaUsecases } from '../../ports/driver/PessoaUsecases';
import { DBPort } from '../../ports/driven/DBPort';
import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';
import { Pessoa } from '../entities/Pessoa';
import { Lead } from '../entities/Lead';

export class PessoaUsecasesImpl implements PessoaUsecases {
  constructor(private db: DBPort) {}

  async getPessoas(user: UserSession): Promise<Pessoa[]> {
    return this.db.getPessoas();
  }

  async getPessoaById(user: UserSession, id: number): Promise<Pessoa | null> {
    return this.db.getPessoaById(id);
  }

  async createPessoa(user: UserSession, pessoa: Omit<Pessoa, 'id'>): Promise<Pessoa> {
    const created = await this.db.createPessoa(pessoa);
    
    // Auto-link leads by phone number
    try {
      const leads = await this.db.getLeadsByPhone(created.phone);
      for (const lead of leads) {
        if (lead.id) {
          await this.db.updateLead(lead.id, { pessoa_id: created.id });
        }
      }
    } catch (e) {
      console.error('Erro ao auto-vincular leads na criação de pessoa:', e);
    }
    
    return created;
  }

  async updatePessoa(user: UserSession, id: number, pessoa: Partial<Pessoa>): Promise<Pessoa> {
    const updated = await this.db.updatePessoa(id, pessoa);
    
    // If phone is updated, auto-link leads with the new phone
    if (pessoa.phone) {
      try {
        const leads = await this.db.getLeadsByPhone(updated.phone);
        for (const lead of leads) {
          if (lead.id) {
            await this.db.updateLead(lead.id, { pessoa_id: updated.id });
          }
        }
      } catch (e) {
        console.error('Erro ao auto-vincular leads na atualização de pessoa:', e);
      }
    }
    
    return updated;
  }

  async deletePessoa(user: UserSession, id: number): Promise<boolean> {
    return this.db.deletePessoa(id);
  }

  async getLeadsByPessoaId(user: UserSession, pessoaId: number): Promise<Lead[]> {
    const leads = await this.db.getLeadsByPessoaId(pessoaId);
    
    if (user.role !== 'superadmin') {
      const companyId = user.companyId;
      const filteredLeads: Lead[] = [];
      for (const lead of leads) {
        const agent = await this.db.getAgentById(lead.agent_id);
        if (agent && agent.empresa_id === companyId) {
          filteredLeads.push(lead);
        }
      }
      return filteredLeads;
    }
    return leads;
  }
}
