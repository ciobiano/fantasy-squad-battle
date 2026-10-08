// The only place that talks to the FPL API over HTTP. Everything else in
// lib/fpl builds on fplFetch, so if FPL changes or blocks us, this is the
// single file to fix.
//
// Routing: requests go to FPL directly. FPL's CDN blocks some Vercel server
// IPs with a 403 (see CLAUDE.md), so on a 403 we switch to the Cloudflare
// relay (relay/) and keep using it for a cooldown, instead of paying for a
// doomed direct attempt on every request.

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
  blockCooldownMs: 10 * 60_000,
} as const;

export type FplRoute = "direct" | "relay";

export interface RelayConfig {
  readonly url: string;
  readonly key: string;
}

/** Remembers that this server's IP is blocked, so we go straight to the relay. */
export interface DirectBreaker {
  isOpen(now: number): boolean;
  trip(now: number): void;
}

export function createDirectBreaker(cooldownMs: number = DEFAULTS.blockCooldownMs): DirectBreaker {
  let blockedUntil = 0;
  return {
    isOpen: (now) => now < blockedUntil,
    trip: (now) => {
      blockedUntil = now + cooldownMs;
    },
  };
}

const sharedBreaker = createDirectBreaker();

export interface FplFetchOptions {
  readonly retries?: number;
  readonly baseDelayMs?: number;
  readonly timeoutMs?: number;
  /** Extra fetch options, e.g. `{ next: { revalidate: 3600 } }`. */
  readonly init?: RequestInit;
  /** Defaults to FPL_RELAY_URL and FPL_RELAY_KEY; `null` disables the relay. */
  readonly relay?: RelayConfig | null;
  readonly breaker?: DirectBreaker;
  readonly now?: () => number;
  readonly fetchImpl?: typeof fetch;
  readonly sleep?: (ms: number) => Promise<void>;
}

export interface FplResponse {
  readonly body: unknown;
  readonly via: FplRoute;
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

function relayFromEnv(): RelayConfig | null {
  const url = process.env.FPL_RELAY_URL;
  const key = process.env.FPL_RELAY_KEY;
  return url && key ? { url, key } : null;
}

/** Resolves a relative API path, refusing anything that escapes the FPL API. */
export function resolveFplUrl(path: string): URL {
  const url = new URL(path, FPL_BASE_URL);
  if (url.origin !== new URL(FPL_BASE_URL).origin || !url.pathname.startsWith("/api/")) {
    throw new FplHttpError(path, null, `Refusing non-FPL path: ${path}`);
  }
  return url;
}

/** Browser-like defaults, overridable per request. */
function buildHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(BROWSER_HEADERS);
  new Headers(extra).forEach((value, key) => headers.set(key, value));
  return headers;
}

function target(fplUrl: URL, route: FplRoute, relay: RelayConfig | null, init?: RequestInit) {
  const headers = buildHeaders(init?.headers);
  if (route === "direct" || !relay) return { url: fplUrl, headers };
  headers.set("x-relay-key", relay.key);
  return { url: new URL(`${fplUrl.pathname}${fplUrl.search}`, relay.url), headers };
}

type Attempt =
  | { readonly kind: "ok"; readonly body: unknown }
  | { readonly kind: "retry"; readonly status: number | null; readonly reason: string }
  | { readonly kind: "fail"; readonly status: number; readonly reason: string };

async function attemptOnce(
  url: URL,
  headers: Headers,
  timeoutMs: number,
  init: RequestInit | undefined,
  fetchImpl: typeof fetch,
): Promise<Attempt> {
  try {
    const response = await fetchImpl(url, { ...init, headers, signal: AbortSignal.timeout(timeoutMs) });
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
 * `unknown` plus the route that served it. Callers must validate the shape.
 */
export async function fplFetchDetailed(path: string, options: FplFetchOptions = {}): Promise<FplResponse> {
  const fplUrl = resolveFplUrl(path);
  const relay = options.relay === undefined ? relayFromEnv() : options.relay;
  const breaker = options.breaker ?? sharedBreaker;
  const now = options.now ?? Date.now;
  const retries = options.retries ?? DEFAULTS.retries;
  const baseDelayMs = options.baseDelayMs ?? DEFAULTS.baseDelayMs;
  const sleep = options.sleep ?? defaultSleep;
  let route: FplRoute = relay && breaker.isOpen(now()) ? "relay" : "direct";

  for (let attempt = 0; ; attempt++) {
    const { url, headers } = target(fplUrl, route, relay, options.init);
    const timeoutMs = options.timeoutMs ?? DEFAULTS.timeoutMs;
    const result = await attemptOnce(url, headers, timeoutMs, options.init, options.fetchImpl ?? fetch);
    if (result.kind === "ok") return { body: result.body, via: route };

    if (route === "direct" && result.status === 403 && relay) {
      breaker.trip(now());
      route = "relay";
      continue; // switch immediately: backing off won't unblock this IP
    }
    if (result.kind === "fail" || attempt >= retries) {
      throw new FplHttpError(path, result.status, `FPL ${path} failed via ${route}: ${result.reason}`);
    }
    await sleep(baseDelayMs * 2 ** attempt);
  }
}

/** Like fplFetchDetailed, returning just the parsed JSON body. */
export async function fplFetch(path: string, options: FplFetchOptions = {}): Promise<unknown> {
  return (await fplFetchDetailed(path, options)).body;
}
