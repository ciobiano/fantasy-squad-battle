// The inspection endpoints (/api/health, /api/league/*, /api/team/*, /api/tools)
// are for checking data on previews, which sit behind Vercel's login. On
// production they don't exist: each answers 404 before doing any work, so
// nobody can use them to make us hammer FPL.

export const inspectionAllowed = (env: Record<string, string | undefined> = process.env): boolean =>
  env.VERCEL_ENV !== "production";

export const hidden = (): Response => new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
