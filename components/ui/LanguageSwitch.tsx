import type { Lang } from "@/lib/cards/types";
import { segment, segmented } from "@/lib/variants";

const NAMES: readonly { code: Lang; name: string }[] = [
  { code: "pcm", name: "Pidgin" },
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
];

/** Pidgin · English · Français, saved in a cookie by /prefs. A plain form: no JavaScript needed. */
export function LanguageSwitch({ current, back, label }: { current: Lang; back: string; label: string }) {
  return (
    <form method="post" action="/prefs" className={segmented()} aria-label={label}>
      <input type="hidden" name="back" value={back} />
      {NAMES.map((l) => (
        <button key={l.code} type="submit" name="lang" value={l.code} lang={l.code} aria-pressed={l.code === current} className={segment()}>
          {l.name}
        </button>
      ))}
    </form>
  );
}
