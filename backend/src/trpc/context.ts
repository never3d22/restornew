import { initTRPC } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import SuperJSON from "superjson";
import { createDb } from "../db";
import { env } from "../env";

export type AppContext = {
  db: Awaited<ReturnType<typeof createDb>>;
  customerId?: number;
  isAdmin: boolean;
};

export async function createContext({ req }: FetchCreateContextFnOptions): Promise<AppContext> {
  const db = await createDb();
  const authHeader = req.headers.get("x-customer-id");
  const adminHeader = req.headers.get("x-admin-secret");

  const parsedCustomerId = authHeader ? Number.parseInt(authHeader, 10) : undefined;

  return {
    db,
    customerId:
      typeof parsedCustomerId === "number" && Number.isFinite(parsedCustomerId)
        ? parsedCustomerId
        : undefined,
    isAdmin: Boolean(env.ADMIN_SECRET) && adminHeader === env.ADMIN_SECRET
  };
}

const t = initTRPC.context<AppContext>().create({
  transformer: SuperJSON
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.isAdmin) {
    throw new Error("Admin access required");
  }
  return next();
});

export const authedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.customerId) {
    throw new Error("Authentication required");
  }
  return next();
});
