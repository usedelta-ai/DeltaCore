import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pool from '../db';
import path from 'path';

export async function runMigrations() {
  console.log('[Migrations] Iniciando verificação/aplicação de migrações...');
  const db = drizzle(pool);

  try {
    // Aponta para a pasta de migrations no dist (copiada no build) ou src (durante dev)
    const migrationsFolder = path.join(__dirname, 'migrations');
    
    await migrate(db, {
      migrationsFolder: migrationsFolder,
    });
    console.log('[Migrations] Todas as migrações aplicadas com sucesso!');
  } catch (error) {
    console.error('[Migrations] Erro crítico ao executar migrações:', error);
    throw error;
  }
}
