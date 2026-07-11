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

/** Called on a 403 PASSWORD_CHANGE_REQUIRED so the app can show the set-password gate. */
let passwordChangeHandler: (() => void) | null = null;
export function setPasswordChangeHandler(fn: () => void) {
  passwordChangeHandler = fn;
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
  code?: string;
}

export class ApiError extends Error {
  status: number;
  payload: unknown;
  /** Machine-readable code from the backend (e.g. "PASSWORD_CHANGE_REQUIRED"). */
  code?: string;
  constructor(status: number, message: string, payload?: unknown, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
    this.code = code;
  }
}

export type Query = Record<string, string | number | boolean | undefined | null>;

/**
 * In the packaged desktop app the UI runs on a secure `tauri://` origin, so the
 * webview blocks plain-http requests (mixed content) and enforces CORS against
 * the backend. Route requests through the Tauri HTTP plugin (Rust side) there;
 * fall back to the browser's fetch everywhere else.
 */
export async function resolveFetch(): Promise<typeof fetch> {
  if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
    const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http");
    return tauriFetch as typeof fetch;
  }
  return fetch;
}

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
    const doFetch = await resolveFetch();
    res = await doFetch(`${API_BASE}/api${path}${qs(query)}`, {
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
  // Forced-password-change gate: a restricted token hits a guarded endpoint.
  // Surface the code so the app can route to the set-password screen — DON'T logout.
  if (res.status === 403 && json?.code === "PASSWORD_CHANGE_REQUIRED") {
    passwordChangeHandler?.();
    throw new ApiError(403, json?.error ?? "Password change required", json, json.code);
  }
  if (!res.ok || !json || json.success === false) {
    throw new ApiError(res.status, json?.error ?? json?.message ?? res.statusText, json, json?.code);
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
