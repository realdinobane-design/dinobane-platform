import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("DATABASE_URL environment variable is not set. Add it in Railway → dinobane-platform service → Variables.");
}

// Railway internal hostnames never need SSL.
// External/public URLs do (with rejectUnauthorized:false for self-signed certs).
const isInternal = dbUrl.includes(".railway.internal") || dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");

export const pool = new Pool({
  connectionString: dbUrl,
  ssl: isInternal ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
});

// Test connection immediately so we get a clear error on startup if DB is unreachable
pool.connect()
  .then(client => { client.release(); console.log("[db] connected to PostgreSQL"); })
  .catch(err => { console.error("[db] FAILED to connect to PostgreSQL:", err.message); });

export const db = drizzle(pool, { schema });
