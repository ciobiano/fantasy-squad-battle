// The language switch posts { lang, back } to /prefs. This reads that form:
// the language to save (if it's one we speak) and where to go back to.
import { isLang, type Lang } from "./lang";

export interface LanguageChoice {
  readonly lang: Lang | null;
  /** A path on this site, or "/". Never anything that could leave the site. */
  readonly back: string;
}

/** Refuses anything that could leave the site ("//evil.example", "/\\evil", full URLs). */
function safeBackPath(raw: FormDataEntryValue | null): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  return raw;
}

export function languageChoice(form: FormData): LanguageChoice {
  const lang = form.get("lang");
  return { lang: isLang(lang) ? lang : null, back: safeBackPath(form.get("back")) };
}
