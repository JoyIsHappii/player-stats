import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
    user: "joy",
    host: "localhost",
    database: "worldcup",
    port: 5432
});

export default pool;