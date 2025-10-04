import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import SuperJSON from "superjson";
import type { AppRouter } from "@backend/index";
import { useAuthStore } from "@/store/auth";
import { useAdminStore } from "@/store/admin";

export const trpc = createTRPCReact<AppRouter>();

export const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/trpc";

export const trpcClient = trpc.createClient({
  transformer: SuperJSON,
  links: [
    httpBatchLink({
      url: apiUrl,
      headers() {
        const { customerId } = useAuthStore.getState();
        const { adminSecret } = useAdminStore.getState();
        const headers: Record<string, string> = {
          "content-type": "application/json"
        };
        if (customerId) {
          headers["x-customer-id"] = String(customerId);
        }
        if (adminSecret) {
          headers["x-admin-secret"] = adminSecret;
        }
        return headers;
      }
    })
  ]
});
