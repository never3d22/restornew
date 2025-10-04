import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { fileURLToPath } from "node:url";
import { appRouter } from "./trpc/router";
import { createContext } from "./trpc/context";
import { env } from "./env";

const app = new Hono();

app.get("/", (c) => {
  const accept = c.req.header("accept") ?? "";
  const { protocol, host } = new URL(c.req.url);
  const baseUrl = `${protocol}//${host}`;

  if (accept.includes("text/html")) {
    return c.html(`<!doctype html>
      <html lang="ru">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>RestorNew API</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 2rem auto; max-width: 720px; line-height: 1.6; color: #1f2933; }
            code { background: #f1f5f9; padding: 0.1rem 0.35rem; border-radius: 0.25rem; }
            a { color: #2563eb; }
            header { margin-bottom: 2rem; }
            ul { padding-left: 1.25rem; }
          </style>
        </head>
        <body>
          <header>
            <h1>RestorNew API</h1>
            <p>Сервер успешно запущен. Используйте мобильное приложение или tRPC-клиента для взаимодействия с данными.</p>
          </header>
          <section>
            <h2>Быстрый старт</h2>
            <ul>
              <li>tRPC endpoint: <code>${baseUrl}/trpc</code></li>
              <li>Админ-панель в приложении: используйте логин <code>admin</code> и пароль <code>1234</code></li>
              <li>Мобильный клиент: укажите <code>EXPO_PUBLIC_API_URL</code> = <code>${baseUrl}/trpc</code></li>
            </ul>
          </section>
          <section>
            <h2>Полезные ссылки</h2>
            <ul>
              <li><a href="/health">/health</a> — проверка статуса</li>
            </ul>
          </section>
        </body>
      </html>`);
  }

  return c.json({ status: "ok" });
});
app.get("/health", (c) => c.text("healthy"));

app.all("/trpc/*", (c) => {
  return fetchRequestHandler({
    endpoint: "/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext
  });
});

const port = env.PORT;
const isMain = typeof process !== "undefined" && process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  serve({
    fetch: app.fetch,
    port,
    hostname: "0.0.0.0"
  });
  console.log(`API running on http://localhost:${port}`);
}

export type { AppRouter } from "./trpc/router";
