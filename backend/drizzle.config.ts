import { loadEnv } from "./src/shared/loadEnv";
import { defineConfig } from "drizzle-kit";

loadEnv();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql2",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "mysql://user:password@localhost:3306/restornew"
  }
});
