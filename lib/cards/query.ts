// The query string of a card URL (?format&theme&lang, plus &preview=1 for the
// in-app copy), and every preview query. next.config.ts reads this file to
// allow exactly those through the image optimiser (shared images never go
// through it), and the config loader can't follow "@/" paths: keep its
// imports relative and its runtime imports to the language list.
import { LANGS } from "../i18n/lang";
import type { CardFormat, CardOptions, CardTheme } from "./types";

export const FORMATS: readonly CardFormat[] = ["status", "x"];
export const THEMES: readonly CardTheme[] = ["dark", "light"];

export const cardQuery = ({ format, theme, lang, preview }: CardOptions): string =>
  `?format=${format}&theme=${theme}&lang=${lang}${preview ? "&preview=1" : ""}`;

/** Every in-app (preview) query cardUrl can produce: the only ones the image optimiser takes. */
export const cardQueries = (): readonly string[] =>
  FORMATS.flatMap((format) => THEMES.flatMap((theme) => LANGS.map((lang) => cardQuery({ format, theme, lang, preview: true }))));
