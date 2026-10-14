import { connection } from "next/server";
import { getInjuryReport } from "@/lib/tools/injuries";
import { TICKER_WEEKS, getTicker } from "@/lib/tools/ticker";

// Inspection endpoint for Phase 3b: the fixture ticker (?weeks=, default 6) and
// the injuries & bans report, as the Fixtures and Players tabs will read them.
// TODO(before launch): remove, or rate-limit with Vercel Firewall (like /api/health).

const WEEKS = /^([1-9]|[1-3]\d)$/;

const error = (status: number, code: string) =>
  Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  await connection();
  const weeksParam = new URL(request.url).searchParams.get("weeks");
  if (weeksParam !== null && !WEEKS.test(weeksParam)) return error(400, "invalid-weeks");

  const started = performance.now();
  try {
    const [ticker, injuries] = await Promise.all([
      getTicker(weeksParam === null ? TICKER_WEEKS : Number(weeksParam)),
      getInjuryReport(Date.now()),
    ]);
    const ms = Math.round(performance.now() - started);
    return Response.json({ ms, ticker, injuries }, { headers: { "Cache-Control": "no-store" } });
  } catch (failure) {
    console.error("[tools] failed", failure);
    return error(502, "fpl-unavailable");
  }
}
