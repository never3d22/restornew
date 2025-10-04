import type { Context } from "hono";
import { initTRPC } from "@trpc/server";
import SuperJSON from "superjson";
import { createDb } from "../db";

export type AppContext = {
  db: Awaited<ReturnType<typeof createDb>>;
  customerId?: number;
  isAdmin: boolean;
};

export async function createContext(c: Context): Promise<AppContext> {
  const db = await createDb();
  const authHeader = c.req.header("x-customer-id");
  const adminHeader = c.req.header("x-admin-secret");

  return {
    db,
    customerId: authHeader ? Number(authHeader) : undefined,
    isAdmin: adminHeader === process.env.ADMIN_SECRET
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
