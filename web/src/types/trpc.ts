import type {
  RouterInputs as BackendRouterInputs,
  RouterOutputs as BackendRouterOutputs,
  RouterClientError
} from "@backend/trpc/types";

export type RouterInputs = BackendRouterInputs;
export type RouterOutputs = BackendRouterOutputs;
export type TrpcClientError = RouterClientError;
