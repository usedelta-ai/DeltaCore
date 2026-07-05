import { FastifyInstance } from 'fastify';
import { MainController } from './controllers/MainController';
import { authMiddleware } from './middlewares/AuthMiddleware';

export async function setupRoutes(app: FastifyInstance, controller: MainController) {
  // Pre-handler hook for all API routes to check authentication & tenancy roles
  app.addHook('preHandler', authMiddleware);

  // Empresas
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
  app.post('/api/leads', (req: any, rep) => controller.createLead(req, rep));
  app.put('/api/leads/:id', (req: any, rep) => controller.updateLead(req, rep));
  app.delete('/api/leads/:id', (req: any, rep) => controller.deleteLead(req, rep));

  // Chat History / Messages
  app.get('/api/agents/:agentId/history', (req: any, rep) => controller.getAgentHistory(req, rep));
  app.get('/api/leads/:leadId/history', (req: any, rep) => controller.getLeadHistory(req, rep));
  app.get('/api/messages/:id/media', (req: any, rep) => controller.getMessageMedia(req, rep));

  // Evolution API
  app.get('/api/evolution/instances', (req, rep) => controller.getEvolutionInstances(req, rep));
  app.get('/api/evolution/connection-state/:instanceName', (req: any, rep) => controller.getEvolutionConnectionState(req, rep));
  app.get('/api/evolution/connect/:instanceName', (req: any, rep) => controller.connectEvolution(req, rep));
}
