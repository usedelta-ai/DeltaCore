"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainController = void 0;
class MainController {
    empresaUsecases;
    agentUsecases;
    followUpUsecases;
    leadUsecases;
    chatUsecases;
    evolutionUsecases;
    userUsecases;
    constructor(empresaUsecases, agentUsecases, followUpUsecases, leadUsecases, chatUsecases, evolutionUsecases, userUsecases) {
        this.empresaUsecases = empresaUsecases;
        this.agentUsecases = agentUsecases;
        this.followUpUsecases = followUpUsecases;
        this.leadUsecases = leadUsecases;
        this.chatUsecases = chatUsecases;
        this.evolutionUsecases = evolutionUsecases;
        this.userUsecases = userUsecases;
    }
    // ---------------------------------------------------------------------------
    // EMPRESAS
    // ---------------------------------------------------------------------------
    async getEmpresas(request, reply) {
        try {
            const data = await this.empresaUsecases.getEmpresas(request.user);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to fetch empresas.' });
        }
    }
    async createEmpresa(request, reply) {
        const { name, logo } = request.body;
        try {
            const data = await this.empresaUsecases.createEmpresa(request.user, name, logo);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to create empresa.' });
        }
    }
    async updateEmpresa(request, reply) {
        const id = parseInt(request.params.id, 10);
        const { name, logo } = request.body;
        try {
            const data = await this.empresaUsecases.updateEmpresa(request.user, id, name, logo);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to update empresa.' });
        }
    }
    async deleteEmpresa(request, reply) {
        const id = parseInt(request.params.id, 10);
        try {
            await this.empresaUsecases.deleteEmpresa(request.user, id);
            return { message: 'Empresa inactivated successfully' };
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to delete empresa.' });
        }
    }
    async getPublicEmpresa(request, reply) {
        const { base64Id } = request.params;
        try {
            const data = await this.empresaUsecases.getPublicEmpresa(base64Id);
            return data;
        }
        catch (err) {
            reply.status(404).send({ error: err.message || 'Empresa não encontrada.' });
        }
    }
    // ---------------------------------------------------------------------------
    // AGENTS
    // ---------------------------------------------------------------------------
    async getAgents(request, reply) {
        try {
            const data = await this.agentUsecases.getAgents(request.user);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to fetch agents.' });
        }
    }
    async createAgent(request, reply) {
        try {
            const data = await this.agentUsecases.createAgent(request.user, request.body);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to create agent.' });
        }
    }
    async updateAgent(request, reply) {
        const id = parseInt(request.params.id, 10);
        try {
            const data = await this.agentUsecases.updateAgent(request.user, id, request.body);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to update agent.' });
        }
    }
    async deleteAgent(request, reply) {
        const id = parseInt(request.params.id, 10);
        try {
            await this.agentUsecases.deleteAgent(request.user, id);
            return { message: 'Agent inactivated successfully' };
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to delete agent.' });
        }
    }
    // ---------------------------------------------------------------------------
    // FOLLOW UP SETTINGS
    // ---------------------------------------------------------------------------
    async getFollowUpSettings(request, reply) {
        try {
            const data = await this.followUpUsecases.getFollowUpSettings(request.user);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to fetch settings.' });
        }
    }
    async createFollowUpSetting(request, reply) {
        try {
            const data = await this.followUpUsecases.createFollowUpSetting(request.user, request.body);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to create setting.' });
        }
    }
    async updateFollowUpSetting(request, reply) {
        const id = parseInt(request.params.id, 10);
        try {
            const data = await this.followUpUsecases.updateFollowUpSetting(request.user, id, request.body);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to update setting.' });
        }
    }
    async deleteFollowUpSetting(request, reply) {
        const id = parseInt(request.params.id, 10);
        try {
            await this.followUpUsecases.deleteFollowUpSetting(request.user, id);
            return { message: 'Follow-up setting inactivated successfully' };
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to delete setting.' });
        }
    }
    // ---------------------------------------------------------------------------
    // LEADS
    // ---------------------------------------------------------------------------
    async getLeads(request, reply) {
        try {
            const { empresa, agente } = request.query;
            const data = await this.leadUsecases.getLeads(request.user, {
                empresaId: empresa ? Number(empresa) : undefined,
                agentId: agente ? Number(agente) : undefined
            });
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to fetch leads.' });
        }
    }
    async getLeadById(request, reply) {
        const id = parseInt(request.params.id, 10);
        try {
            const data = await this.leadUsecases.getLeadById(request.user, id);
            if (!data)
                return reply.status(404).send({ error: 'Lead not found' });
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to fetch lead.' });
        }
    }
    async createLead(request, reply) {
        try {
            const data = await this.leadUsecases.createLead(request.user, request.body);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to create lead.' });
        }
    }
    async updateLead(request, reply) {
        const id = parseInt(request.params.id, 10);
        try {
            const data = await this.leadUsecases.updateLead(request.user, id, request.body);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to update lead.' });
        }
    }
    async deleteLead(request, reply) {
        const id = parseInt(request.params.id, 10);
        try {
            await this.leadUsecases.deleteLead(request.user, id);
            return { message: 'Lead cancelled successfully' };
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to delete lead.' });
        }
    }
    // ---------------------------------------------------------------------------
    // MESSAGES & HISTORY
    // ---------------------------------------------------------------------------
    async getAgentHistory(request, reply) {
        const agentId = parseInt(request.params.agentId, 10);
        try {
            const data = await this.chatUsecases.getAgentHistory(request.user, agentId);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to retrieve agent history.' });
        }
    }
    async getLeadHistory(request, reply) {
        const leadId = parseInt(request.params.leadId, 10);
        try {
            const data = await this.chatUsecases.getLeadHistory(request.user, leadId);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to retrieve lead history.' });
        }
    }
    async getLeadAgentHistory(request, reply) {
        const leadId = parseInt(request.params.leadId, 10);
        try {
            const data = await this.chatUsecases.getLeadAgentHistory(request.user, leadId);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to retrieve lead agent history.' });
        }
    }
    async getMessageMedia(request, reply) {
        const messageId = parseInt(request.params.id, 10);
        try {
            const data = await this.chatUsecases.getMessageMedia(request.user, messageId);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to fetch message media.' });
        }
    }
    async sendMessage(request, reply) {
        const leadId = parseInt(request.params.leadId, 10);
        const { message, messageType, mediaBase64, fileName, quotedMessageId } = request.body;
        try {
            const data = await this.chatUsecases.sendMessage(request.user, leadId, message, { messageType, mediaBase64, fileName, quotedMessageId });
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to send message.' });
        }
    }
    async sendPresence(request, reply) {
        const leadId = parseInt(request.params.leadId, 10);
        const { presence } = request.body;
        try {
            await this.chatUsecases.sendPresence(request.user, leadId, presence);
            return { success: true };
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to send presence.' });
        }
    }
    // ---------------------------------------------------------------------------
    // EVOLUTION API
    // ---------------------------------------------------------------------------
    async getEvolutionInstances(request, reply) {
        try {
            const data = await this.evolutionUsecases.getEvolutionInstances(request.user);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to fetch evolution instances.' });
        }
    }
    async getEvolutionConnectionState(request, reply) {
        try {
            const data = await this.evolutionUsecases.getEvolutionConnectionState(request.user, request.params.instanceName);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to fetch connection state.' });
        }
    }
    async connectEvolution(request, reply) {
        try {
            const data = await this.evolutionUsecases.connectEvolution(request.user, request.params.instanceName);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to connect to Evolution instance.' });
        }
    }
    async getMediaByWhatsAppId(request, reply) {
        try {
            const data = await this.evolutionUsecases.getBase64FromMediaMessage(request.params.instanceName, request.params.messageId);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to fetch media from Evolution.' });
        }
    }
    // ---------------------------------------------------------------------------
    // AUTH & USERS
    // ---------------------------------------------------------------------------
    async login(request, reply) {
        const { email, password, empresaId } = request.body;
        try {
            const data = await this.userUsecases.login(email, password, empresaId !== undefined ? Number(empresaId) : undefined);
            return data;
        }
        catch (err) {
            reply.status(401).send({ error: err.message || 'Login failed.' });
        }
    }
    async getUsers(request, reply) {
        try {
            const data = await this.userUsecases.getUsers(request.user);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to fetch users.' });
        }
    }
    async createUser(request, reply) {
        try {
            const data = await this.userUsecases.createUser(request.user, request.body);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to create user.' });
        }
    }
    async updateUser(request, reply) {
        const id = parseInt(request.params.id, 10);
        try {
            const data = await this.userUsecases.updateUser(request.user, id, request.body);
            return data;
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to update user.' });
        }
    }
    async deleteUser(request, reply) {
        const id = parseInt(request.params.id, 10);
        try {
            await this.userUsecases.deleteUser(request.user, id);
            return { message: 'User deleted successfully' };
        }
        catch (err) {
            reply.status(500).send({ error: err.message || 'Failed to delete user.' });
        }
    }
}
exports.MainController = MainController;
