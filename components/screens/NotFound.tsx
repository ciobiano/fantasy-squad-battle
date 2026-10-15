// The 404 page: the wordmark and an "Offside" headline on the sky, then one
// way home. "/" opens the remembered league, or Start.
import Link from "next/link";
import { copyFor, type Lang } from "@/lib/i18n";
import { button, column, onSkyKicker, onSkyTitle, panel, panelBody, wordmark, wordmarkSquare } from "@/lib/variants";

export function NotFound({ lang }: { lang: Lang }) {
  const t = copyFor(lang).notFound;
  return (
    <div lang={lang} className={column({ gap: "lg" })}>
      <span className={wordmark()}>
        <span aria-hidden="true" className={wordmarkSquare()} />
        Fantasy Squad Battle
      </span>
      <header>
        <span className={onSkyKicker()}>404</span>
        <h1 className={onSkyTitle()}>{t.title}</h1>
      </header>
      <div className={panel()}>
        <p className={panelBody()}>{t.body}</p>
        <Link href="/" className={button({ intent: "primary" })}>
          {t.home}
        </Link>
      </div>
    </div>
  );
}
