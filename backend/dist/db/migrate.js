"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const node_postgres_1 = require("drizzle-orm/node-postgres");
const migrator_1 = require("drizzle-orm/node-postgres/migrator");
const db_1 = __importDefault(require("../db"));
const path_1 = __importDefault(require("path"));
async function runMigrations() {
    console.log('[Migrations] Iniciando verificação/aplicação de migrações...');
    const db = (0, node_postgres_1.drizzle)(db_1.default);
    try {
        // Aponta para a pasta de migrations no dist (copiada no build) ou src (durante dev)
        const migrationsFolder = path_1.default.join(__dirname, 'migrations');
        await (0, migrator_1.migrate)(db, {
            migrationsFolder: migrationsFolder,
        });
        console.log('[Migrations] Todas as migrações aplicadas com sucesso!');
    }
    catch (error) {
        console.error('[Migrations] Erro crítico ao executar migrações:', error);
        throw error;
    }
}
