// Request-time reads for screens: the language and the remembered team.
// These use cookies and headers (server only: next/headers fails in client code),
// so callers sit inside <Suspense>.
import { cookies, headers } from "next/headers";
import { LANG_COOKIE, resolveLang, type Lang } from "@/lib/i18n";
import { TEAM_COOKIE, rememberedId } from "./remembered";

export async function requestLang(): Promise<Lang> {
  const [jar, head] = await Promise.all([cookies(), headers()]);
  return resolveLang(jar.get(LANG_COOKIE)?.value, head.get("accept-language"));
}

export async function rememberedTeam(): Promise<number | null> {
  const jar = await cookies();
  return rememberedId(jar.get(TEAM_COOKIE)?.value);
}
