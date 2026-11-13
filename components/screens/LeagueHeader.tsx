// The top of the League tab: gameweek, league name (tap to change league),
// theme, and the Market | Table | On paper switch. Sits on the sky. The sample
// league has no squads, so it has no On paper.
import Link from "next/link";
import { copyFor, type Lang } from "@/lib/i18n";
import { SAMPLE_LEAGUE } from "@/lib/ids";
import type { LeagueView } from "@/lib/screens/league";
import { onSkyKicker, onSkyRow, onSkyTitle, segment, segmented, titleLink } from "@/lib/variants";
import { ThemeToggle } from "../ui/ThemeToggle";
import { ChevronDown } from "../ui/icons";

export function LeagueHeader({ view, lang }: { view: LeagueView; lang: Lang }) {
  const t = copyFor(lang);
  const { leagueId, leagueName, gw, tab, changeHref } = view;
  const gwLabel =
    gw === null ? "" : tab === "table" ? t.league.afterGameweek(gw) : tab === "paper" ? t.league.squadsAsOf(gw) : t.league.gameweek(gw);
  return (
    <>
      <header className={onSkyRow()}>
        <div>
          <span className={onSkyKicker()}>{gwLabel}</span>
          <h1 className={onSkyTitle()}>
            <Link href={changeHref} aria-label={t.league.changeLeague(leagueName)} className={titleLink()}>
              {leagueName}
              <ChevronDown size={20} />
            </Link>
          </h1>
        </div>
        <ThemeToggle labels={t.theme} />
      </header>
      <nav aria-label={t.league.viewLabel} className={segmented()}>
        <Link href={`/league/${leagueId}`} aria-current={tab === "market" ? "page" : undefined} className={segment({ size: "sm" })}>
          Market
        </Link>
        <Link href={`/league/${leagueId}/table`} aria-current={tab === "table" ? "page" : undefined} className={segment({ size: "sm" })}>
          Table
        </Link>
        {leagueId !== SAMPLE_LEAGUE ? (
          <Link href={`/league/${leagueId}/paper`} aria-current={tab === "paper" ? "page" : undefined} className={segment({ size: "sm" })}>
            {t.league.paperView}
          </Link>
        ) : null}
      </nav>
    </>
  );
}
