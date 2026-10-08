// The only place that talks to the FPL API over HTTP. Everything else in
// lib/fpl builds on fplFetch, so if FPL changes or blocks us, this is the
// single file to fix.

export const FPL_BASE_URL = "https://fantasy.premierleague.com/api/";

// FPL rejects traffic that doesn't look like a browser (see CLAUDE.md).
const BROWSER_HEADERS: Readonly<Record<string, string>> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-GB,en;q=0.9",
  Referer: "https://fantasy.premierleague.com/",
};

const RETRYABLE_STATUSES: ReadonlySet<number> = new Set([403, 429, 500, 502, 503, 504]);

const DEFAULTS = {
  retries: 2,
  baseDelayMs: 400,
  timeoutMs: 10_000,
} as const;

export interface FplFetchOptions {
  readonly retries?: number;
  readonly baseDelayMs?: number;
  readonly timeoutMs?: number;
  /** Extra fetch options, e.g. `{ next: { revalidate: 3600 } }`. */
  readonly init?: RequestInit;
  readonly fetchImpl?: typeof fetch;
  readonly sleep?: (ms: number) => Promise<void>;
}

export class FplHttpError extends Error {
  constructor(
    readonly path: string,
    readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = "FplHttpError";
  }
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Browser-like defaults, overridable per request. */
function buildHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(BROWSER_HEADERS);
  new Headers(extra).forEach((value, key) => headers.set(key, value));
  return headers;
}

/** Resolves a relative API path, refusing anything that escapes the FPL API. */
export function resolveFplUrl(path: string): URL {
  const url = new URL(path, FPL_BASE_URL);
  if (url.origin !== new URL(FPL_BASE_URL).origin || !url.pathname.startsWith("/api/")) {
    throw new FplHttpError(path, null, `Refusing non-FPL path: ${path}`);
  }
  return url;
}

type Attempt =
  | { readonly kind: "ok"; readonly body: unknown }
  | { readonly kind: "retry"; readonly status: number | null; readonly reason: string }
  | { readonly kind: "fail"; readonly status: number; readonly reason: string };

async function attemptOnce(
  url: URL,
  timeoutMs: number,
  init: RequestInit | undefined,
  fetchImpl: typeof fetch,
): Promise<Attempt> {
  try {
    const response = await fetchImpl(url, {
      ...init,
      headers: buildHeaders(init?.headers),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.ok) return { kind: "ok", body: await response.json() };
    const reason = `HTTP ${response.status}`;
    return RETRYABLE_STATUSES.has(response.status)
      ? { kind: "retry", status: response.status, reason }
      : { kind: "fail", status: response.status, reason };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { kind: "retry", status: null, reason };
  }
}

/**
 * GETs an FPL API path (relative to /api/) and returns the parsed JSON as
 * `unknown`. Callers must validate the shape. Retries blocked, rate-limited,
 * failing and timed-out requests with exponential backoff.
 */
export async function fplFetch(path: string, options: FplFetchOptions = {}): Promise<unknown> {
  const url = resolveFplUrl(path);
  const retries = options.retries ?? DEFAULTS.retries;
  const baseDelayMs = options.baseDelayMs ?? DEFAULTS.baseDelayMs;
  const timeoutMs = options.timeoutMs ?? DEFAULTS.timeoutMs;
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;

  for (let attempt = 0; ; attempt++) {
    const result = await attemptOnce(url, timeoutMs, options.init, fetchImpl);
    if (result.kind === "ok") return result.body;
    if (result.kind === "fail" || attempt >= retries) {
      throw new FplHttpError(path, result.status, `FPL ${path} failed: ${result.reason}`);
    }
    await sleep(baseDelayMs * 2 ** attempt);
  }
}
