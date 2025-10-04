import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/router";
import { createContext } from "./trpc/context";
import { env } from "./env";

const app = new Hono();

app.get("/", (c) => c.json({ status: "ok" }));
app.get("/health", (c) => c.text("healthy"));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext
  })
);

const port = env.PORT;

if (import.meta.main) {
  serve({
    fetch: app.fetch,
    port,
    hostname: "0.0.0.0"
  });
  console.log(`API running on http://localhost:${port}`);
}

export type { AppRouter } from "./trpc/router";
