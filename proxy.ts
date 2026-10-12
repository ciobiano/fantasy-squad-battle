import { NextResponse, type NextRequest } from "next/server";
import { LEAGUE_COOKIE, TEAM_COOKIE, rememberedId } from "@/lib/ui/remembered";

// Remembered on the phone, with no accounts:
// - visiting /team/{id} or /league/{id} saves that ID in a cookie;
// - opening "/" goes straight to the last league, unless the link says ?start=1.
const YEAR = 60 * 60 * 24 * 365;
const TEAM_PATH = /^\/team\/(\d{1,10})$/;
const LEAGUE_PATH = /^\/league\/(\d{1,10})(?:\/table)?$/;

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/") {
    const league = rememberedId(request.cookies.get(LEAGUE_COOKIE)?.value);
    if (league !== null && !searchParams.has("start")) {
      return NextResponse.redirect(new URL(`/league/${league}`, request.url), 307);
    }
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const remember = (name: string, value: string) =>
    response.cookies.set(name, value, { path: "/", maxAge: YEAR, sameSite: "lax" });
  const team = TEAM_PATH.exec(pathname);
  if (team) remember(TEAM_COOKIE, team[1]);
  const league = LEAGUE_PATH.exec(pathname);
  if (league) remember(LEAGUE_COOKIE, league[1]);
  return response;
}

export const config = {
  matcher: ["/", "/team/:id", "/league/:id", "/league/:id/table"],
};
