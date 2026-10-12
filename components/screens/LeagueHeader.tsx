// The top of the League tab: gameweek, league name (tap to change league),
// theme, and the Market | Table switch. Sits on the sky.
import Link from "next/link";
import { copyFor, type Lang } from "@/lib/i18n";
import { onSkyKicker, onSkyRow, onSkyTitle, segment, segmented, titleLink } from "@/lib/variants";
import { ThemeToggle } from "../ui/ThemeToggle";
import { ChevronDown } from "../ui/icons";

interface LeagueHeaderProps {
  readonly lang: Lang;
  readonly leagueId: string;
  readonly leagueName: string;
  readonly gwLabel: string;
  readonly view: "market" | "table";
  /** Where "Change league" goes: the remembered team's picker, or Start. */
  readonly changeHref: string;
}

export function LeagueHeader({ lang, leagueId, leagueName, gwLabel, view, changeHref }: LeagueHeaderProps) {
  const t = copyFor(lang);
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
        <Link href={`/league/${leagueId}`} aria-current={view === "market" ? "page" : undefined} className={segment({ size: "sm" })}>
          Market
        </Link>
        <Link href={`/league/${leagueId}/table`} aria-current={view === "table" ? "page" : undefined} className={segment({ size: "sm" })}>
          Table
        </Link>
      </nav>
    </>
  );
}
