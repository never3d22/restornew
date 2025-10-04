import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import type { MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "./schema";

const DEFAULT_URL = "mysql://user:password@localhost:3306/restornew";

export type Database = MySql2Database<typeof schema>;

let dbPromise: Promise<Database> | null = null;

async function initDb(url: string) {
  const connection = await mysql.createConnection(url);
  return drizzle(connection, { schema });
}

export async function createDb(url = process.env.DATABASE_URL ?? DEFAULT_URL) {
  if (!dbPromise) {
    dbPromise = initDb(url);
  }
  return dbPromise;
}

export * from "./schema";
