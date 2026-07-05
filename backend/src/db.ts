import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;

export async function checkTableExists(tableName: string): Promise<boolean> {
  const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
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
