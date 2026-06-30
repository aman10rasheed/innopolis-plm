/* ============================================================================
 * API CLIENT — the single transport layer for the Innopolis PLM backend.
 * ----------------------------------------------------------------------------
 * - Injects the JWT, parses the `{success,message,data,meta}` envelope.
 * - Throws a typed `ApiError` on `success:false` / non-2xx.
 * - On 401: clears the token and notifies a registered handler (→ logout).
 * - `toNumber()` converts the backend's numeric-as-string fields at the boundary.
 *
 * Endpoint functions live in `endpoints.ts` (the `api` object); React Query
 * hooks in `hooks.ts`; snake→camel domain mapping in `mappers.ts`.
 * ==========================================================================*/

export const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:7100"
).replace(/\/+$/, "");

/** When true the app talks to the real API; when false it uses the mock db. */
export const USE_API = process.env.NEXT_PUBLIC_USE_API === "true";

const TOKEN_KEY = "innopolis-token";

export const tokenStore = {
  get: (): string | null =>
    typeof localStorage === "undefined" ? null : localStorage.getItem(TOKEN_KEY),
  set: (t: string) => {
    if (typeof localStorage !== "undefined") localStorage.setItem(TOKEN_KEY, t);
  },
  clear: () => {
    if (typeof localStorage !== "undefined") localStorage.removeItem(TOKEN_KEY);
  },
};

/** Called on any 401 so the app can clear auth state and route to login. */
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  unauthorizedHandler = fn;
}

export interface ApiMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: ApiMeta;
  error?: string;
}

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export type Query = Record<string, string | number | boolean | undefined | null>;

function qs(query?: Query): string {
  if (!query) return "";
  const parts = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Query;
  /** default true — attach Authorization header */
  auth?: boolean;
  signal?: AbortSignal;
}

/** Low-level call returning the full envelope. */
export async function apiFetch<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  const { method = "GET", body, query, auth = true, signal } = opts;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api${path}${qs(query)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (e) {
    throw new ApiError(0, `Network error: ${(e as Error).message}`);
  }

  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (res.status === 401) {
    // A 401 on an authenticated request = expired/invalid session → drop it and
    // bounce to login. A 401 on a public request (e.g. login itself) is just a
    // failed credential check — surface the message without nuking app state.
    if (auth) {
      tokenStore.clear();
      unauthorizedHandler?.();
    }
    throw new ApiError(401, json?.error ?? json?.message ?? "Unauthorized", json);
  }
  if (!res.ok || !json || json.success === false) {
    throw new ApiError(res.status, json?.error ?? json?.message ?? res.statusText, json);
  }
  return json;
}

/** Returns just `data`. */
export async function req<T>(path: string, opts?: RequestOptions): Promise<T> {
  return (await apiFetch<T>(path, opts)).data;
}

/** Returns `{ items, meta }` for paginated list endpoints. */
export async function reqList<T>(
  path: string,
  opts?: RequestOptions,
): Promise<{ items: T[]; meta: ApiMeta }> {
  const env = await apiFetch<T[]>(path, opts);
  return {
    items: env.data ?? [],
    meta: env.meta ?? { page: 1, pageSize: env.data?.length ?? 0, total: env.data?.length ?? 0, totalPages: 1 },
  };
}

/** Convert the backend's numeric-as-string fields to numbers. */
export function toNumber(x: unknown): number {
  if (x === null || x === undefined || x === "") return 0;
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}
