import fastify from 'fastify';
import cors from '@fastify/cors';
import { PostgresAdapter } from './adapters/driven/db/PostgresAdapter';
import { EvolutionAdapter } from './adapters/driven/evolution/EvolutionAdapter';

// Usecases Implementation
import { EmpresaUsecasesImpl } from './domain/usecases/EmpresaUsecasesImpl';
import { AgentUsecasesImpl } from './domain/usecases/AgentUsecasesImpl';
import { FollowUpUsecasesImpl } from './domain/usecases/FollowUpUsecasesImpl';
import { LeadUsecasesImpl } from './domain/usecases/LeadUsecasesImpl';
import { ChatUsecasesImpl } from './domain/usecases/ChatUsecasesImpl';
import { EvolutionUsecasesImpl } from './domain/usecases/EvolutionUsecasesImpl';
import { UserUsecasesImpl } from './domain/usecases/UserUsecasesImpl';
import { PessoaUsecasesImpl } from './domain/usecases/PessoaUsecasesImpl';

import { MainController } from './adapters/driver/http/controllers/MainController';
import { setupRoutes } from './adapters/driver/http/routes';
import { runMigrations } from './db/migrate';

const app = fastify({ logger: true });

// Enable CORS
app.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-user-company-id'],
});

// Hexagonal dependency injection setup (SOLID - separated by responsibility)
const dbAdapter = new PostgresAdapter();
const evolutionAdapter = new EvolutionAdapter();

const empresaUsecases = new EmpresaUsecasesImpl(dbAdapter);
const agentUsecases = new AgentUsecasesImpl(dbAdapter, evolutionAdapter);
const followUpUsecases = new FollowUpUsecasesImpl(dbAdapter);
const leadUsecases = new LeadUsecasesImpl(dbAdapter);
const chatUsecases = new ChatUsecasesImpl(dbAdapter, evolutionAdapter);
const evolutionUsecases = new EvolutionUsecasesImpl(evolutionAdapter);
const userUsecases = new UserUsecasesImpl(dbAdapter);
const pessoaUsecases = new PessoaUsecasesImpl(dbAdapter);

const controller = new MainController(
  empresaUsecases,
  agentUsecases,
  followUpUsecases,
  leadUsecases,
  chatUsecases,
  evolutionUsecases,
  userUsecases,
  pessoaUsecases
);

// Wire up HTTP routes
setupRoutes(app, controller);

// Start the server
const start = async () => {
  try {
    // Executa as migrações automáticas antes de abrir a porta do servidor
    await runMigrations();

    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server is running on port ${port} under Hexagonal & SOLID Architecture`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
