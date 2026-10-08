import { FplHttpError, fplFetch } from "@/lib/fpl/http";

// Phase 0 spike: proves the FPL API answers from wherever this runs (local or a
// Vercel region). Each probe hits an endpoint the app will depend on.
// TODO(before launch): remove, or put behind Vercel Firewall rate limiting.

const PROBES = [
  { name: "bootstrap", path: "bootstrap-static/" },
  { name: "fixtures", path: "fixtures/" },
  { name: "standings", path: "leagues-classic/314/standings/" },
  { name: "dreamTeam", path: "dream-team/1/" },
] as const;

interface ProbeResult {
  readonly name: string;
  readonly ok: boolean;
  readonly status: number | null;
  readonly ms: number;
}

async function probe(name: string, path: string): Promise<ProbeResult> {
  const started = performance.now();
  const elapsed = () => Math.round(performance.now() - started);
  try {
    await fplFetch(path, { retries: 1, init: { cache: "no-store" } });
    return { name, ok: true, status: 200, ms: elapsed() };
  } catch (error) {
    const status = error instanceof FplHttpError ? error.status : null;
    console.error(`[health] ${name} failed`, error);
    return { name, ok: false, status, ms: elapsed() };
  }
}

export async function GET() {
  const probes = await Promise.all(PROBES.map(({ name, path }) => probe(name, path)));
  const ok = probes.every((p) => p.ok);

  return Response.json(
    { ok, region: process.env.VERCEL_REGION ?? "local", probes },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
