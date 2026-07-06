"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load env from the project root directory
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../../.env') });
const passKey = process.env.PASS_KEY;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error('DATABASE_URL is not set in env');
    process.exit(1);
}
if (!passKey) {
    console.error('PASS_KEY is not set in env');
    process.exit(1);
}
const pool = new pg_1.Pool({ connectionString: databaseUrl });
async function main() {
    console.log('Iniciando seed do usuário admin...');
    // 1. Criar a tabela se ela não existir
    await pool.query(`
    CREATE TABLE IF NOT EXISTS public.users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'employee',
        empresa_id INT REFERENCES public.empresa(id) ON DELETE SET NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
    console.log('Tabela public.users verificada/criada.');
    // 2. Definir dados do admin
    const email = 'admin@delta.ai';
    const plainPassword = 'admin123';
    // Pepper + Bcrypt
    const peppered = crypto_1.default.createHmac('sha256', passKey).update(plainPassword).digest('hex');
    const hashedPassword = bcryptjs_1.default.hashSync(peppered, 10);
    // 3. Upsert do Admin
    const check = await pool.query('SELECT id FROM public.users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
        await pool.query('UPDATE public.users SET password = $1, role = $2, active = true, updated_at = NOW() WHERE email = $3', [hashedPassword, 'superadmin', email]);
        console.log(`Senha do usuário admin (${email}) atualizada com sucesso para "${plainPassword}".`);
    }
    else {
        await pool.query(`INSERT INTO public.users (name, email, password, role, empresa_id, active, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, null, true, NOW(), NOW())`, ['Administrador DeltaAI', email, hashedPassword, 'superadmin']);
        console.log(`Usuário admin (${email}) criado com sucesso com a senha "${plainPassword}".`);
    }
    await pool.end();
    console.log('Seed concluído com sucesso!');
}
main().catch(err => {
    console.error('Erro ao executar o seed:', err);
    process.exit(1);
});
