import { FastifyInstance } from 'fastify';
import { MainController } from './controllers/MainController';
import { authMiddleware } from './middlewares/AuthMiddleware';

export async function setupRoutes(app: FastifyInstance, controller: MainController) {
  // Pre-handler hook for all API routes to check authentication & tenancy roles
  app.addHook('preHandler', authMiddleware);

  // Empresas
  app.get('/api/empresas/public/:base64Id', (req: any, rep) => controller.getPublicEmpresa(req, rep));
  app.get('/api/empresas', (req, rep) => controller.getEmpresas(req, rep));
  app.post('/api/empresas', (req: any, rep) => controller.createEmpresa(req, rep));
  app.put('/api/empresas/:id', (req: any, rep) => controller.updateEmpresa(req, rep));
  app.delete('/api/empresas/:id', (req: any, rep) => controller.deleteEmpresa(req, rep));

  // Agents
  app.get('/api/agents', (req, rep) => controller.getAgents(req, rep));
  app.post('/api/agents', (req: any, rep) => controller.createAgent(req, rep));
  app.put('/api/agents/:id', (req: any, rep) => controller.updateAgent(req, rep));
  app.delete('/api/agents/:id', (req: any, rep) => controller.deleteAgent(req, rep));

  // Follow-up Settings
  app.get('/api/follow-up-settings', (req, rep) => controller.getFollowUpSettings(req, rep));
  app.post('/api/follow-up-settings', (req: any, rep) => controller.createFollowUpSetting(req, rep));
  app.put('/api/follow-up-settings/:id', (req: any, rep) => controller.updateFollowUpSetting(req, rep));
  app.delete('/api/follow-up-settings/:id', (req: any, rep) => controller.deleteFollowUpSetting(req, rep));

  // Leads
  app.get('/api/leads', (req, rep) => controller.getLeads(req, rep));
  app.get('/api/leads/summary', (req, rep) => controller.getLeadsSummary(req, rep));
  app.get('/api/leads/avatars', (req, rep) => controller.getBulkAvatars(req, rep));
  app.get('/api/leads/:id', (req: any, rep) => controller.getLeadById(req, rep));
  app.get('/api/leads/:leadId/avatar', (req: any, rep) => controller.getLeadAvatar(req, rep));
  app.post('/api/leads', (req: any, rep) => controller.createLead(req, rep));
  app.put('/api/leads/:id', (req: any, rep) => controller.updateLead(req, rep));
  app.delete('/api/leads/:id', (req: any, rep) => controller.deleteLead(req, rep));

  // Chat History / Messages
  app.get('/api/agents/:agentId/history', (req: any, rep) => controller.getAgentHistory(req, rep));
  app.get('/api/leads/:leadId/history', (req: any, rep) => controller.getLeadHistory(req, rep));
  app.get('/api/leads/:leadId/agent-history', (req: any, rep) => controller.getLeadAgentHistory(req, rep));
  app.get('/api/messages/:id/media', (req: any, rep) => controller.getMessageMedia(req, rep));
  app.post('/api/leads/:leadId/send-message', (req: any, rep) => controller.sendMessage(req, rep));
  app.post('/api/leads/:leadId/presence', (req: any, rep) => controller.sendPresence(req, rep));

  // Evolution API
  app.get('/api/evolution/instances', (req, rep) => controller.getEvolutionInstances(req, rep));
  app.get('/api/evolution/connection-state/:instanceName', (req: any, rep) => controller.getEvolutionConnectionState(req, rep));
  app.get('/api/evolution/connect/:instanceName', (req: any, rep) => controller.connectEvolution(req, rep));
  app.get('/api/media/:instanceName/:messageId', (req: any, rep) => controller.getMediaByWhatsAppId(req, rep));

  // Authentication
  app.post('/api/auth/login', (req: any, rep) => controller.login(req, rep));
  app.post('/api/auth/change-password', (req: any, rep) => controller.changePassword(req, rep));
  app.post('/api/auth/logout', (req: any, rep) => controller.logout(req, rep));
  app.get('/api/auth/me', (req, rep) => controller.getMe(req, rep));
  app.put('/api/auth/avatar', (req: any, rep) => controller.updateAvatar(req, rep));

  // Users (Protected)
  app.get('/api/users', (req, rep) => controller.getUsers(req, rep));
  app.post('/api/users', (req: any, rep) => controller.createUser(req, rep));
  app.put('/api/users/:id', (req: any, rep) => controller.updateUser(req, rep));
  app.delete('/api/users/:id', (req: any, rep) => controller.deleteUser(req, rep));
  app.post('/api/users/:id/reset-password', (req: any, rep) => controller.resetUserPassword(req, rep));

  // Pessoas (Protected)
  app.get('/api/pessoas', (req, rep) => controller.getPessoas(req, rep));
  app.get('/api/pessoas/:id', (req: any, rep) => controller.getPessoaById(req, rep));
  app.post('/api/pessoas', (req: any, rep) => controller.createPessoa(req, rep));
  app.put('/api/pessoas/:id', (req: any, rep) => controller.updatePessoa(req, rep));
  app.delete('/api/pessoas/:id', (req: any, rep) => controller.deletePessoa(req, rep));
  app.get('/api/pessoas/:id/leads', (req: any, rep) => controller.getLeadsByPessoaId(req, rep));
}
