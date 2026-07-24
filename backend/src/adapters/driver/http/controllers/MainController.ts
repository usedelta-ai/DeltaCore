import { FastifyRequest, FastifyReply } from 'fastify';
import { EmpresaUsecases } from '../../../../ports/driver/EmpresaUsecases';
import { AgentUsecases } from '../../../../ports/driver/AgentUsecases';
import { FollowUpUsecases } from '../../../../ports/driver/FollowUpUsecases';
import { LeadUsecases } from '../../../../ports/driver/LeadUsecases';
import { ChatUsecases } from '../../../../ports/driver/ChatUsecases';
import { EvolutionUsecases } from '../../../../ports/driver/EvolutionUsecases';
import { UserUsecases } from '../../../../ports/driver/UserUsecases';
import { PessoaUsecases } from '../../../../ports/driver/PessoaUsecases';

export class MainController {
  constructor(
    private empresaUsecases: EmpresaUsecases,
    private agentUsecases: AgentUsecases,
    private followUpUsecases: FollowUpUsecases,
    private leadUsecases: LeadUsecases,
    private chatUsecases: ChatUsecases,
    private evolutionUsecases: EvolutionUsecases,
    private userUsecases: UserUsecases,
    private pessoaUsecases: PessoaUsecases
  ) {}

  // ---------------------------------------------------------------------------
  // EMPRESAS
  // ---------------------------------------------------------------------------
  async getEmpresas(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await this.empresaUsecases.getEmpresas(request.user!);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch empresas.' });
    }
  }

  async createEmpresa(request: FastifyRequest<{ Body: { name: string; logo: string | null } }>, reply: FastifyReply) {
    const { name, logo } = request.body;
    try {
      const data = await this.empresaUsecases.createEmpresa(request.user!, name, logo);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to create empresa.' });
    }
  }

  async updateEmpresa(request: FastifyRequest<{ Params: { id: string }; Body: { name: string; logo?: string | null } }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    const { name, logo } = request.body;
    try {
      const data = await this.empresaUsecases.updateEmpresa(request.user!, id, name, logo);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to update empresa.' });
    }
  }

  async deleteEmpresa(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      await this.empresaUsecases.deleteEmpresa(request.user!, id);
      return { message: 'Empresa inactivated successfully' };
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to delete empresa.' });
    }
  }

  async getPublicEmpresa(request: FastifyRequest<{ Params: { base64Id: string } }>, reply: FastifyReply) {
    const { base64Id } = request.params;
    try {
      const data = await this.empresaUsecases.getPublicEmpresa(base64Id);
      return data;
    } catch (err: any) {
      reply.status(404).send({ error: err.message || 'Empresa não encontrada.' });
    }
  }

  // ---------------------------------------------------------------------------
  // AGENTS
  // ---------------------------------------------------------------------------
  async getAgents(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await this.agentUsecases.getAgents(request.user!);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch agents.' });
    }
  }

  async createAgent(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const data = await this.agentUsecases.createAgent(request.user!, request.body as any);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to create agent.' });
    }
  }

  async updateAgent(request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      const data = await this.agentUsecases.updateAgent(request.user!, id, request.body as any);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to update agent.' });
    }
  }

  async deleteAgent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      await this.agentUsecases.deleteAgent(request.user!, id);
      return { message: 'Agent inactivated successfully' };
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to delete agent.' });
    }
  }

  // ---------------------------------------------------------------------------
  // FOLLOW UP SETTINGS
  // ---------------------------------------------------------------------------
  async getFollowUpSettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await this.followUpUsecases.getFollowUpSettings(request.user!);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch settings.' });
    }
  }

  async createFollowUpSetting(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const data = await this.followUpUsecases.createFollowUpSetting(request.user!, request.body as any);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to create setting.' });
    }
  }

  async updateFollowUpSetting(request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      const data = await this.followUpUsecases.updateFollowUpSetting(request.user!, id, request.body as any);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to update setting.' });
    }
  }

  async deleteFollowUpSetting(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      await this.followUpUsecases.deleteFollowUpSetting(request.user!, id);
      return { message: 'Follow-up setting inactivated successfully' };
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to delete setting.' });
    }
  }

  // ---------------------------------------------------------------------------
  // LEADS
  // ---------------------------------------------------------------------------
  async getLeads(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { empresa, agente, search, page, pageSize, status, month } = request.query as any;
      const data = await this.leadUsecases.getLeads(request.user!, {
        empresaId: empresa ? Number(empresa) : undefined,
        agentId: agente ? Number(agente) : undefined,
        search: search || undefined,
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 30,
        status: status || undefined,
        month: month || undefined,
      });
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch leads.' });
    }
  }

  async getLeadsSummary(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { empresa, agente, search, month } = request.query as any;
      const data = await this.leadUsecases.getLeadsSummary(request.user!, {
        empresaId: empresa ? Number(empresa) : undefined,
        agentId: agente ? Number(agente) : undefined,
        search: search || undefined,
        month: month || undefined,
      });
      return data;
    } catch (err: any) {
      console.error('getLeadsSummary error:', err?.message, err?.stack);
      reply.status(500).send({ error: err.message || 'Failed to fetch leads summary.' });
    }
  }

  async getLeadById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      const data = await this.leadUsecases.getLeadById(request.user!, id);
      if (!data) return reply.status(404).send({ error: 'Lead not found' });
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch lead.' });
    }
  }

  async getBulkAvatars(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { ids } = request.query as any;
      if (!ids) return {};
      const idList = String(ids).split(',').map(Number).filter(Boolean);
      const data = await this.leadUsecases.getBulkAvatars(request.user!, idList);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch avatars.' });
    }
  }

  async getLeadAvatar(request: FastifyRequest<{ Params: { leadId: string } }>, reply: FastifyReply) {
    const leadId = parseInt(request.params.leadId, 10);
    try {
      const url = await this.leadUsecases.getLeadAvatar(request.user!, leadId);
      return { url };
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch lead avatar.' });
    }
  }

  async createLead(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const data = await this.leadUsecases.createLead(request.user!, request.body as any);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to create lead.' });
    }
  }

  async updateLead(request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      const data = await this.leadUsecases.updateLead(request.user!, id, request.body as any);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to update lead.' });
    }
  }

  async deleteLead(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      await this.leadUsecases.deleteLead(request.user!, id);
      return { message: 'Lead cancelled successfully' };
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to delete lead.' });
    }
  }

  // ---------------------------------------------------------------------------
  // MESSAGES & HISTORY
  // ---------------------------------------------------------------------------
  async getAgentHistory(request: FastifyRequest<{ Params: { agentId: string } }>, reply: FastifyReply) {
    const agentId = parseInt(request.params.agentId, 10);
    try {
      const data = await this.chatUsecases.getAgentHistory(request.user!, agentId);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to retrieve agent history.' });
    }
  }

  async getLeadHistory(request: FastifyRequest<{ Params: { leadId: string } }>, reply: FastifyReply) {
    const leadId = parseInt(request.params.leadId, 10);
    try {
      const data = await this.chatUsecases.getLeadHistory(request.user!, leadId);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to retrieve lead history.' });
    }
  }

  async getLeadAgentHistory(request: FastifyRequest<{ Params: { leadId: string } }>, reply: FastifyReply) {
    const leadId = parseInt(request.params.leadId, 10);
    try {
      const data = await this.chatUsecases.getLeadAgentHistory(request.user!, leadId);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to retrieve lead agent history.' });
    }
  }

  async getMessageMedia(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const messageId = parseInt(request.params.id, 10);
    try {
      const data = await this.chatUsecases.getMessageMedia(request.user!, messageId);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch message media.' });
    }
  }

  async sendMessage(request: FastifyRequest<{ Params: { leadId: string }; Body: { message: string; messageType?: string; mediaBase64?: string; fileName?: string; quotedMessageId?: number } }>, reply: FastifyReply) {
    const leadId = parseInt(request.params.leadId, 10);
    const { message, messageType, mediaBase64, fileName, quotedMessageId } = request.body;
    try {
      const data = await this.chatUsecases.sendMessage(request.user!, leadId, message, { messageType, mediaBase64, fileName, quotedMessageId });
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to send message.' });
    }
  }

  async sendPresence(request: FastifyRequest<{ Params: { leadId: string }; Body: { presence: 'composing' | 'recording' } }>, reply: FastifyReply) {
    const leadId = parseInt(request.params.leadId, 10);
    const { presence } = request.body;
    try {
      await this.chatUsecases.sendPresence(request.user!, leadId, presence);
      return { success: true };
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to send presence.' });
    }
  }

  // ---------------------------------------------------------------------------
  // EVOLUTION API
  // ---------------------------------------------------------------------------
  async getEvolutionInstances(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await this.evolutionUsecases.getEvolutionInstances(request.user!);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch evolution instances.' });
    }
  }

  async getEvolutionConnectionState(request: FastifyRequest<{ Params: { instanceName: string } }>, reply: FastifyReply) {
    try {
      const data = await this.evolutionUsecases.getEvolutionConnectionState(request.user!, request.params.instanceName);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch connection state.' });
    }
  }

  async connectEvolution(request: FastifyRequest<{ Params: { instanceName: string } }>, reply: FastifyReply) {
    try {
      const data = await this.evolutionUsecases.connectEvolution(request.user!, request.params.instanceName);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to connect to Evolution instance.' });
    }
  }

  async getMediaByWhatsAppId(request: FastifyRequest<{ Params: { instanceName: string; messageId: string } }>, reply: FastifyReply) {
    try {
      const data = await this.evolutionUsecases.getBase64FromMediaMessage(request.params.instanceName, request.params.messageId);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch media from Evolution.' });
    }
  }

  // ---------------------------------------------------------------------------
  // AUTH & USERS
  // ---------------------------------------------------------------------------
  async login(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    const { email, password, empresaId } = request.body as any;
    try {
      const ip = request.ip;
      const ua = request.headers['user-agent'];
      const deviceInfo = typeof ua === 'string' ? ua : null;
      const data = await this.userUsecases.login(
        email,
        password,
        empresaId !== undefined ? Number(empresaId) : undefined,
        ip,
        deviceInfo
      );
      return data;
    } catch (err: any) {
      reply.status(401).send({ error: err.message || 'Login failed.' });
    }
  }

  async changePassword(request: FastifyRequest<{ Body: { currentPassword: string; newPassword: string } }>, reply: FastifyReply) {
    try {
      const userId = request.user!.userId!;
      const { currentPassword, newPassword } = request.body;
      await this.userUsecases.changePassword(userId, currentPassword, newPassword);
      return { message: 'Password changed successfully' };
    } catch (err: any) {
      reply.status(400).send({ error: err.message || 'Failed to change password.' });
    }
  }

  async resetUserPassword(request: FastifyRequest<{ Params: { id: string }; Body: { newPassword: string } }>, reply: FastifyReply) {
    try {
      const targetUserId = parseInt(request.params.id, 10);
      const { newPassword } = request.body;
      await this.userUsecases.resetUserPassword(request.user!, targetUserId, newPassword);
      return { message: 'Password reset successfully. User must change password on next login.' };
    } catch (err: any) {
      reply.status(400).send({ error: err.message || 'Failed to reset password.' });
    }
  }

  async updateAvatar(request: FastifyRequest<{ Body: { avatar: string | null } }>, reply: FastifyReply) {
    try {
      const { avatar } = request.body;
      const updatedUser = await this.userUsecases.updateAvatar(request.user!, avatar);
      return { avatar: updatedUser.avatar };
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to update avatar.' });
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const authHeader = request.headers['authorization'];
      const token = authHeader?.substring(7);
      if (token) {
        await this.userUsecases.logout(token);
      }
      return { message: 'Logged out successfully' };
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to logout.' });
    }
  }

  async getMe(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user!.userId!;
      const currentUser = await this.userUsecases.getUserById(request.user!, userId);
      if (!currentUser) return reply.status(404).send({ error: 'User not found' });
      return {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        empresa_id: currentUser.empresa_id,
        avatar: currentUser.avatar,
        must_change_password: currentUser.must_change_password,
      };
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to get user info.' });
    }
  }

  async getUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { empresa } = request.query as any;
      const companyId = empresa ? Number(empresa) : undefined;
      const data = await this.userUsecases.getUsers(request.user!, companyId);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch users.' });
    }
  }

  async createUser(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const data = await this.userUsecases.createUser(request.user!, request.body as any);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to create user.' });
    }
  }

  async updateUser(request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      const data = await this.userUsecases.updateUser(request.user!, id, request.body as any);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to update user.' });
    }
  }

  async deleteUser(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      await this.userUsecases.deleteUser(request.user!, id);
      return { message: 'User deleted successfully' };
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to delete user.' });
    }
  }

  // ---------------------------------------------------------------------------
  // PESSOAS
  // ---------------------------------------------------------------------------
  async getPessoas(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await this.pessoaUsecases.getPessoas(request.user!);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch pessoas.' });
    }
  }

  async getPessoaById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      const data = await this.pessoaUsecases.getPessoaById(request.user!, id);
      if (!data) return reply.status(404).send({ error: 'Pessoa not found' });
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch pessoa.' });
    }
  }

  async createPessoa(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const data = await this.pessoaUsecases.createPessoa(request.user!, request.body as any);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to create pessoa.' });
    }
  }

  async updatePessoa(request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      const data = await this.pessoaUsecases.updatePessoa(request.user!, id, request.body as any);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to update pessoa.' });
    }
  }

  async deletePessoa(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      await this.pessoaUsecases.deletePessoa(request.user!, id);
      return { message: 'Pessoa deleted successfully' };
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to delete pessoa.' });
    }
  }

  async getLeadsByPessoaId(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      const data = await this.pessoaUsecases.getLeadsByPessoaId(request.user!, id);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch related leads.' });
    }
  }
}
