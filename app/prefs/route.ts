import { LANG_COOKIE, isLang, safeBackPath } from "@/lib/ui/lang";

const YEAR = 60 * 60 * 24 * 365;

// The language switch posts here: save the choice, then go back to the same
// screen. Only paths on this site are allowed as "back".
export async function POST(request: Request) {
  const form = await request.formData();
  const lang = form.get("lang");
  const back = safeBackPath(typeof form.get("back") === "string" ? (form.get("back") as string) : null);
  const response = Response.redirect(new URL(back, request.url), 303);
  if (!isLang(lang)) return response;

  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", `${LANG_COOKIE}=${lang}; Path=/; Max-Age=${YEAR}; SameSite=Lax`);
  return new Response(null, { status: 303, headers });
}
