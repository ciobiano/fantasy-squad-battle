import { NextResponse, type NextRequest } from "next/server";
import { REMEMBER_FOR, onVisit } from "@/lib/remembered";

// Remembered on the phone, with no accounts (lib/remembered.ts decides):
// "/" opens the last league, and team and league pages save their ID.
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const visit = onVisit(pathname, searchParams, (name) => request.cookies.get(name)?.value);
  if (visit.kind === "redirect") return NextResponse.redirect(new URL(visit.to, request.url), 307);

  const response = NextResponse.next();
  for (const { name, value } of visit.save) response.cookies.set(name, value, REMEMBER_FOR);
  return response;
}

export const config = {
  matcher: ["/", "/team/:id", "/league/:id", "/league/:id/table"],
};
