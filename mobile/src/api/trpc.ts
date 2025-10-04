import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import SuperJSON from "superjson";
import type { AppRouter } from "../../backend/src/trpc/router";
import { useAuthStore } from "@/store/auth";

export const trpc = createTRPCReact<AppRouter>();

export const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/trpc";

export const trpcClient = trpc.createClient({
  transformer: SuperJSON,
  links: [
    httpBatchLink({
      url: apiUrl,
      headers() {
        const { customerId } = useAuthStore.getState();
        const headers: Record<string, string> = {
          "content-type": "application/json"
        };
        if (customerId) {
          headers["x-customer-id"] = String(customerId);
        }
        if (process.env.EXPO_PUBLIC_ADMIN_SECRET) {
          headers["x-admin-secret"] = process.env.EXPO_PUBLIC_ADMIN_SECRET;
        }
        return headers;
      }
    })
  ]
});
