// The query string of a card URL (?format&theme&lang), and every value it can
// take. next.config.ts reads this file to allow exactly these queries through
// the image optimiser, and the config loader can't follow "@/" paths: keep its
// imports relative and its runtime imports to the language list.
import { LANGS } from "../i18n/lang";
import type { CardFormat, CardOptions, CardTheme } from "./types";

export const FORMATS: readonly CardFormat[] = ["status", "x"];
export const THEMES: readonly CardTheme[] = ["dark", "light"];

export const cardQuery = ({ format, theme, lang }: CardOptions): string => `?format=${format}&theme=${theme}&lang=${lang}`;

/** Every query cardUrl can produce. */
export const cardQueries = (): readonly string[] =>
  FORMATS.flatMap((format) => THEMES.flatMap((theme) => LANGS.map((lang) => cardQuery({ format, theme, lang }))));
