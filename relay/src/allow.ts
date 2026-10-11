// Pure guards for the relay, kept apart from the Worker entry so they can be
// unit tested in Node. The relay forwards only the FPL endpoints the app uses,
// and only to callers holding the shared key, so it can't become an open proxy.

const ALLOWED_PATHS: readonly RegExp[] = [
  /^\/api\/bootstrap-static\/$/,
  /^\/api\/fixtures\/$/,
  /^\/api\/event-status\/$/,
  /^\/api\/event\/\d{1,2}\/live\/$/,
  /^\/api\/dream-team\/\d{1,2}\/$/,
  /^\/api\/entry\/\d{1,10}\/$/,
  /^\/api\/entry\/\d{1,10}\/history\/$/,
  /^\/api\/entry\/\d{1,10}\/event\/\d{1,2}\/picks\/$/,
  /^\/api\/leagues-classic\/\d{1,10}\/standings\/$/,
];

const ALLOWED_PARAMS: ReadonlySet<string> = new Set(["event", "future", "page_standings"]);

const NUMERIC_VALUE = /^\d{1,6}$/;

export function isAllowedFplRequest(pathname: string, params: URLSearchParams): boolean {
  if (!ALLOWED_PATHS.some((pattern) => pattern.test(pathname))) return false;
  return [...params].every(([key, value]) => ALLOWED_PARAMS.has(key) && NUMERIC_VALUE.test(value));
}

/** Compares without exiting early on the first mismatch (only length leaks). */
export function keysMatch(provided: string | null, expected: string): boolean {
  if (!provided || !expected || provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
