import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import type { MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "./schema";
import { env } from "../env";

export type Database = MySql2Database<typeof schema>;

let pool: mysql.Pool | null = null;
let db: Database | null = null;

function initPool(url: string) {
  if (!pool) {
    pool = mysql.createPool({
      uri: url,
      waitForConnections: true,
      connectionLimit: 10
    });
  }
  if (!db) {
    db = drizzle(pool, { schema, mode: "default" });
  }
  return db;
}

export async function createDb(url = env.DATABASE_URL) {
  return initPool(url);
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

export * from "./schema";
