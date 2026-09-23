import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    user: process.env.PGUSER || "joy",
    host: process.env.PGHOST || "localhost",
    database: process.env.PGDATABASE || "worldcup",
    port: Number(process.env.PGPORT) || 5432,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

export default pool;