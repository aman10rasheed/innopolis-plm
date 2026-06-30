/* Barrel for the API integration layer. Prefer importing hooks for screens:
 *   import { useParts, useCreateBom } from "@/lib/api";
 * or the raw client for one-offs:
 *   import { api } from "@/lib/api";
 */
export { api, type Api } from "./endpoints";
export {
  API_BASE,
  USE_API,
  ApiError,
  apiFetch,
  req,
  reqList,
  toNumber,
  tokenStore,
  setUnauthorizedHandler,
  type ApiMeta,
  type ApiEnvelope,
  type Query,
} from "./client";
export * as mappers from "./mappers";
export * from "./hooks";
export type * from "./types";
