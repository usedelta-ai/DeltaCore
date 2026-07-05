"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTableExists = checkTableExists;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
exports.default = pool;
async function checkTableExists(tableName) {
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
    }
    catch (err) {
        console.error(`Error checking table existence for ${tableName}:`, err);
        return false;
    }
}
