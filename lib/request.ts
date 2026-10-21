// What the current request tells a screen: its language and the remembered
// team. Reads cookies and headers (next/headers works on the server only), so
// callers sit inside <Suspense>.
import { cookies, headers } from "next/headers";
import { LANG_COOKIE, resolveLang, type Lang } from "@/lib/i18n";
import { fplId } from "@/lib/ids";
import { LEAGUE_COOKIE, rememberedTeamId } from "@/lib/remembered";

export async function requestLang(): Promise<Lang> {
  const [jar, head] = await Promise.all([cookies(), headers()]);
  return resolveLang(jar.get(LANG_COOKIE)?.value, head.get("accept-language"));
}

export async function rememberedLeague(): Promise<number | null> {
  const jar = await cookies();
  return fplId(jar.get(LEAGUE_COOKIE)?.value);
}

export async function rememberedTeam(): Promise<number | null> {
  const jar = await cookies();
  return rememberedTeamId((name) => jar.get(name)?.value);
}
