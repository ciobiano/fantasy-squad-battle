// Every word the app and the cards show, per language, and which language to
// use. One catalogue per language: pcm.ts and en.ts (Ralph edits these) and
// fr.ts (beta until a native speaker reviews it). Import from "@/lib/i18n" only.
//
// Typed catalogues rather than next-intl: three languages, no language in the
// URL, server-rendered only, and the card renderer needs the same words outside
// React. The Copy type makes a missing line a compile error, at no runtime cost.
import type { Copy, StartError } from "./copy";
import { en } from "./en";
import { fr } from "./fr";
import type { Lang } from "./lang";
import { pcm } from "./pcm";

const CATALOGUES: Readonly<Record<Lang, Copy>> = { pcm, en, fr };

export const copyFor = (lang: Lang): Copy => CATALOGUES[lang];

/** Every reason Start can show, for checking an ?error= value. */
export const START_ERRORS = Object.keys(en.start.errors) as readonly StartError[];

export type { Copy, StartError };
export { languageChoice, type LanguageChoice } from "./choice";
export { LANG_COOKIE, LANGS, isLang, resolveLang, type Lang } from "./lang";
