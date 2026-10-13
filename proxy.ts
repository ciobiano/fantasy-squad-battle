import { NextResponse, type NextRequest } from "next/server";
import { REMEMBER_FOR, onVisit } from "@/lib/remembered";

// Runs before a page renders (lib/remembered.ts decides): "/" opens the last
// league, a league page with no valid ID is a real 404, and team and league
// pages save their ID. Pages stream, and a streamed page's status is always 200,
// so a 404 has to be decided here.
const NO_SUCH_PAGE = "/404";

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const visit = onVisit(pathname, searchParams, (name) => request.cookies.get(name)?.value);
  if (visit.kind === "redirect") return NextResponse.redirect(new URL(visit.to, request.url), 307);
  // No route matches /404, so Next renders its not-found page with a 404 status.
  if (visit.kind === "not-found") return NextResponse.rewrite(new URL(NO_SUCH_PAGE, request.url));

  const response = NextResponse.next();
  for (const { name, value } of visit.save) response.cookies.set(name, value, REMEMBER_FOR);
  return response;
}

export const config = {
  matcher: ["/", "/team/:id", "/league/:id", "/league/:id/table", "/league/:id/story/:card"],
};
