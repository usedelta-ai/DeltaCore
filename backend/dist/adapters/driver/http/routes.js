"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
const AuthMiddleware_1 = require("./middlewares/AuthMiddleware");
async function setupRoutes(app, controller) {
    // Pre-handler hook for all API routes to check authentication & tenancy roles
    app.addHook('preHandler', AuthMiddleware_1.authMiddleware);
    // Empresas
    app.get('/api/empresas', (req, rep) => controller.getEmpresas(req, rep));
    app.post('/api/empresas', (req, rep) => controller.createEmpresa(req, rep));
    app.put('/api/empresas/:id', (req, rep) => controller.updateEmpresa(req, rep));
    app.delete('/api/empresas/:id', (req, rep) => controller.deleteEmpresa(req, rep));
    // Agents
    app.get('/api/agents', (req, rep) => controller.getAgents(req, rep));
    app.post('/api/agents', (req, rep) => controller.createAgent(req, rep));
    app.put('/api/agents/:id', (req, rep) => controller.updateAgent(req, rep));
    app.delete('/api/agents/:id', (req, rep) => controller.deleteAgent(req, rep));
    // Follow-up Settings
    app.get('/api/follow-up-settings', (req, rep) => controller.getFollowUpSettings(req, rep));
    app.post('/api/follow-up-settings', (req, rep) => controller.createFollowUpSetting(req, rep));
    app.put('/api/follow-up-settings/:id', (req, rep) => controller.updateFollowUpSetting(req, rep));
    app.delete('/api/follow-up-settings/:id', (req, rep) => controller.deleteFollowUpSetting(req, rep));
    // Leads
    app.get('/api/leads', (req, rep) => controller.getLeads(req, rep));
    app.post('/api/leads', (req, rep) => controller.createLead(req, rep));
    app.put('/api/leads/:id', (req, rep) => controller.updateLead(req, rep));
    app.delete('/api/leads/:id', (req, rep) => controller.deleteLead(req, rep));
    // Chat History / Messages
    app.get('/api/agents/:agentId/history', (req, rep) => controller.getAgentHistory(req, rep));
    app.get('/api/leads/:leadId/history', (req, rep) => controller.getLeadHistory(req, rep));
    app.get('/api/leads/:leadId/agent-history', (req, rep) => controller.getLeadAgentHistory(req, rep));
    app.get('/api/messages/:id/media', (req, rep) => controller.getMessageMedia(req, rep));
    app.post('/api/leads/:leadId/send-message', (req, rep) => controller.sendMessage(req, rep));
    // Evolution API
    app.get('/api/evolution/instances', (req, rep) => controller.getEvolutionInstances(req, rep));
    app.get('/api/evolution/connection-state/:instanceName', (req, rep) => controller.getEvolutionConnectionState(req, rep));
    app.get('/api/evolution/connect/:instanceName', (req, rep) => controller.connectEvolution(req, rep));
    app.get('/api/media/:instanceName/:messageId', (req, rep) => controller.getMediaByWhatsAppId(req, rep));
    // Authentication (Public)
    app.post('/api/auth/login', (req, rep) => controller.login(req, rep));
    // Users (Protected)
    app.get('/api/users', (req, rep) => controller.getUsers(req, rep));
    app.post('/api/users', (req, rep) => controller.createUser(req, rep));
    app.put('/api/users/:id', (req, rep) => controller.updateUser(req, rep));
    app.delete('/api/users/:id', (req, rep) => controller.deleteUser(req, rep));
}
