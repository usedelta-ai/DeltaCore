import { FastifyRequest, FastifyReply } from 'fastify';
import { Usecases } from '../../../../ports/driver/Usecases';

export class MainController {
  constructor(private usecases: Usecases) {}

  // ---------------------------------------------------------------------------
  // EMPRESAS
  // ---------------------------------------------------------------------------
  async getEmpresas(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await this.usecases.getEmpresas(request.user!);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch empresas.' });
    }
  }

  async createEmpresa(request: FastifyRequest<{ Body: { name: string; logo: string | null } }>, reply: FastifyReply) {
    const { name, logo } = request.body;
    try {
      const data = await this.usecases.createEmpresa(request.user!, name, logo);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to create empresa.' });
    }
  }

  async updateEmpresa(request: FastifyRequest<{ Params: { id: string }; Body: { name: string; logo?: string | null } }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    const { name, logo } = request.body;
    try {
      const data = await this.usecases.updateEmpresa(request.user!, id, name, logo);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to update empresa.' });
    }
  }

  async deleteEmpresa(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      await this.usecases.deleteEmpresa(request.user!, id);
      return { message: 'Empresa inactivated successfully' };
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to delete empresa.' });
    }
  }

  // ---------------------------------------------------------------------------
  // AGENTS
  // ---------------------------------------------------------------------------
  async getAgents(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await this.usecases.getAgents(request.user!);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch agents.' });
    }
  }

  async createAgent(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const data = await this.usecases.createAgent(request.user!, request.body as any);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to create agent.' });
    }
  }

  async updateAgent(request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      const data = await this.usecases.updateAgent(request.user!, id, request.body as any);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to update agent.' });
    }
  }

  async deleteAgent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      await this.usecases.deleteAgent(request.user!, id);
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
      const data = await this.usecases.getFollowUpSettings(request.user!);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch settings.' });
    }
  }

  async createFollowUpSetting(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const data = await this.usecases.createFollowUpSetting(request.user!, request.body as any);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to create setting.' });
    }
  }

  async updateFollowUpSetting(request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      const data = await this.usecases.updateFollowUpSetting(request.user!, id, request.body as any);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to update setting.' });
    }
  }

  async deleteFollowUpSetting(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      await this.usecases.deleteFollowUpSetting(request.user!, id);
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
      const data = await this.usecases.getLeads(request.user!);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch leads.' });
    }
  }

  async createLead(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const data = await this.usecases.createLead(request.user!, request.body as any);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to create lead.' });
    }
  }

  async updateLead(request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      const data = await this.usecases.updateLead(request.user!, id, request.body as any);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to update lead.' });
    }
  }

  async deleteLead(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    try {
      await this.usecases.deleteLead(request.user!, id);
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
      const data = await this.usecases.getAgentHistory(request.user!, agentId);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to retrieve agent history.' });
    }
  }

  async getLeadHistory(request: FastifyRequest<{ Params: { leadId: string } }>, reply: FastifyReply) {
    const leadId = parseInt(request.params.leadId, 10);
    try {
      const data = await this.usecases.getLeadHistory(request.user!, leadId);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to retrieve lead history.' });
    }
  }

  async getMessageMedia(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const messageId = parseInt(request.params.id, 10);
    try {
      const data = await this.usecases.getMessageMedia(request.user!, messageId);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch message media.' });
    }
  }

  // ---------------------------------------------------------------------------
  // EVOLUTION API
  // ---------------------------------------------------------------------------
  async getEvolutionInstances(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await this.usecases.getEvolutionInstances(request.user!);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch evolution instances.' });
    }
  }

  async getEvolutionConnectionState(request: FastifyRequest<{ Params: { instanceName: string } }>, reply: FastifyReply) {
    try {
      const data = await this.usecases.getEvolutionConnectionState(request.user!, request.params.instanceName);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch connection state.' });
    }
  }

  async connectEvolution(request: FastifyRequest<{ Params: { instanceName: string } }>, reply: FastifyReply) {
    try {
      const data = await this.usecases.connectEvolution(request.user!, request.params.instanceName);
      return data;
    } catch (err: any) {
      reply.status(500).send({ error: err.message || 'Failed to fetch connection QR.' });
    }
  }
}
