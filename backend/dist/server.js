"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const PostgresAdapter_1 = require("./adapters/driven/db/PostgresAdapter");
const EvolutionAdapter_1 = require("./adapters/driven/evolution/EvolutionAdapter");
// Usecases Implementation
const EmpresaUsecasesImpl_1 = require("./domain/usecases/EmpresaUsecasesImpl");
const AgentUsecasesImpl_1 = require("./domain/usecases/AgentUsecasesImpl");
const FollowUpUsecasesImpl_1 = require("./domain/usecases/FollowUpUsecasesImpl");
const LeadUsecasesImpl_1 = require("./domain/usecases/LeadUsecasesImpl");
const ChatUsecasesImpl_1 = require("./domain/usecases/ChatUsecasesImpl");
const EvolutionUsecasesImpl_1 = require("./domain/usecases/EvolutionUsecasesImpl");
const UserUsecasesImpl_1 = require("./domain/usecases/UserUsecasesImpl");
const MainController_1 = require("./adapters/driver/http/controllers/MainController");
const routes_1 = require("./adapters/driver/http/routes");
const app = (0, fastify_1.default)({ logger: true });
// Enable CORS
app.register(cors_1.default, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-user-company-id'],
});
// Hexagonal dependency injection setup (SOLID - separated by responsibility)
const dbAdapter = new PostgresAdapter_1.PostgresAdapter();
const evolutionAdapter = new EvolutionAdapter_1.EvolutionAdapter();
const empresaUsecases = new EmpresaUsecasesImpl_1.EmpresaUsecasesImpl(dbAdapter);
const agentUsecases = new AgentUsecasesImpl_1.AgentUsecasesImpl(dbAdapter, evolutionAdapter);
const followUpUsecases = new FollowUpUsecasesImpl_1.FollowUpUsecasesImpl(dbAdapter);
const leadUsecases = new LeadUsecasesImpl_1.LeadUsecasesImpl(dbAdapter);
const chatUsecases = new ChatUsecasesImpl_1.ChatUsecasesImpl(dbAdapter, evolutionAdapter);
const evolutionUsecases = new EvolutionUsecasesImpl_1.EvolutionUsecasesImpl(evolutionAdapter);
const userUsecases = new UserUsecasesImpl_1.UserUsecasesImpl(dbAdapter);
const controller = new MainController_1.MainController(empresaUsecases, agentUsecases, followUpUsecases, leadUsecases, chatUsecases, evolutionUsecases, userUsecases);
// Wire up HTTP routes
(0, routes_1.setupRoutes)(app, controller);
// Start the server
const start = async () => {
    const port = Number(process.env.PORT) || 3000;
    try {
        await app.listen({ port, host: '0.0.0.0' });
        console.log(`Server is running on port ${port} under Hexagonal & SOLID Architecture`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
