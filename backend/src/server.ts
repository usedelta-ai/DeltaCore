import fastify from 'fastify';
import cors from '@fastify/cors';
import { PostgresAdapter } from './adapters/driven/db/PostgresAdapter';
import { EvolutionAdapter } from './adapters/driven/evolution/EvolutionAdapter';
import { UsecasesImpl } from './domain/usecases/UsecasesImpl';
import { MainController } from './adapters/driver/http/controllers/MainController';
import { setupRoutes } from './adapters/driver/http/routes';

const app = fastify({ logger: true });

// Enable CORS
app.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-user-company-id'],
});

// Hexagonal dependency injection setup
const dbAdapter = new PostgresAdapter();
const evolutionAdapter = new EvolutionAdapter();
const usecases = new UsecasesImpl(dbAdapter, evolutionAdapter);
const controller = new MainController(usecases);

// Wire up HTTP routes
setupRoutes(app, controller);

// Start the server
const start = async () => {
  const port = Number(process.env.PORT) || 3000;
  try {
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server is running on port ${port} under Hexagonal Architecture`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
