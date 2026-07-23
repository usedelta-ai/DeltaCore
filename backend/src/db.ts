import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './db/schema';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export default pool;

export async function checkTableExists(tableName: string): Promise<boolean> {
  const query = `
    SELECT EXISTS (
      SELECT FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = $1
    );
  `;
  try {
    const res = await pool.query(query, [tableName]);
    return res.rows[0]?.exists || false;
  } catch (err) {
    console.error(`Error checking table existence for ${tableName}:`, err);
    return false;
  }
}
