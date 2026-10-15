// The public page for a league's gameweek, as on the canvas (S-Share), on the
// Mist sky like the app's screens: the Wrapped card, the award cards (each
// opens its story), the standings, and a way in for whoever followed the link.
import Link from "next/link";
import { copyFor, type Lang } from "@/lib/i18n";
import type { ShareView } from "@/lib/screens/share";
import {
  button, column, onSkyKicker, onSkyTitle, sectionHead, sectionHeading, shareAward, shareAwards, shareCta, shareCtaSub,
  shareMake, shareNote, shareTop, shareWrap, wordmark, wordmarkSquare,
} from "@/lib/variants";
import { CardImage } from "../ui/CardImage";
import { TableView } from "./TableView";

export function SharePage({ view, lang }: { view: ShareView; lang: Lang }) {
  const t = copyFor(lang);
  const s = t.sharePage;
  return (
    <div lang={lang} className={column({ gap: "lg" })}>
      <header className={shareTop()}>
        <span className={wordmark()}>
          <span aria-hidden="true" className={wordmarkSquare()} />
          Fantasy Squad Battle
        </span>
        <Link href="/?start=1" className={shareMake()}>
          {s.makeYourOwn}
        </Link>
      </header>

      <div>
        <span className={onSkyKicker()}>{t.league.gameweek(view.gw)}</span>
        <h1 className={onSkyTitle()}>{view.leagueName}</h1>
      </div>

      <Link href={view.wrap.href} className={shareWrap()}>
        <CardImage images={view.wrap.images} alt={t.card.wrapTitle(view.gw)} sizes="(max-width: 400px) 92vw, 360px" main />
      </Link>

      <section aria-labelledby="share-awards">
        <div className={sectionHead()}>
          <h2 id="share-awards" className={sectionHeading()}>
            {s.awards}
          </h2>
        </div>
        <div className={shareAwards()}>
          {view.awards.map((award) => (
            <Link key={award.key} href={award.href} className={shareAward()}>
              <CardImage images={award.images} alt={t.awards[award.key]} sizes="220px" />
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="share-table">
        <div className={sectionHead()}>
          <h2 id="share-table" className={sectionHeading()}>
            {t.league.afterGameweek(view.gw)}
          </h2>
        </div>
        <TableView model={view.table} lang={lang} gw={view.gw} />
      </section>

      <p className={shareNote()}>{s.disclaimer}</p>

      <div className={shareCta()}>
        <Link href="/?start=1" className={button({ intent: "primary" })}>
          {s.cta}
        </Link>
        <span className={shareCtaSub()}>{s.ctaSub}</span>
      </div>
    </div>
  );
}
