import { Pool } from "pg";
import { CONFIG } from "../config";

export const db = new Pool({
    connectionString: CONFIG.DATABASE_URL,
});

export default db;
