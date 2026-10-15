import type { NextRequest } from "next/server";
import { findDestination } from "@/lib/screens/start";

// The Start form submits here (GET, so it works without JavaScript and the back
// button behaves): on to the picker or the league, or back to Start with the reason.
export function GET(request: NextRequest) {
  const to = findDestination(Object.fromEntries(request.nextUrl.searchParams));
  return Response.redirect(new URL(to, request.url), 303);
}
