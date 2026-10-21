import type { NextRequest } from "next/server";
import { plannerDestination } from "@/lib/screens/planner";

// The Planner's Start form submits here (GET, so it works without JavaScript
// and the back button behaves): on to the team's rating, or back with the reason.
export function GET(request: NextRequest) {
  const to = plannerDestination(Object.fromEntries(request.nextUrl.searchParams));
  return Response.redirect(new URL(to, request.url), 303);
}
