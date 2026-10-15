import { cookies } from "next/headers";
import { trackServer } from "@/lib/analytics/capture";
import { LANG_COOKIE, isLang, languageChoice } from "@/lib/i18n";

const YEAR = 60 * 60 * 24 * 365;

// The language switch posts here: save the choice, then go back to the same
// screen. Only paths on this site are allowed as "back".
export async function POST(request: Request) {
  const { lang, back } = languageChoice(await request.formData());
  const headers = new Headers({ Location: new URL(back, request.url).toString() });
  if (lang) {
    headers.append("Set-Cookie", `${LANG_COOKIE}=${lang}; Path=/; Max-Age=${YEAR}; SameSite=Lax`);
    const saved = (await cookies()).get(LANG_COOKIE)?.value;
    const from = isLang(saved) ? saved : null;
    if (from !== lang) trackServer("language_changed", { from, to: lang }, request.headers);
  }
  return new Response(null, { status: 303, headers });
}
