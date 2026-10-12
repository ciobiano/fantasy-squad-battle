// Injuries & bans, the first content of the Players tab: newest report first.
// Filters are links (?status=, ?team=), so they work without JavaScript and
// can be shared.
import Link from "next/link";
import type { Lang } from "@/lib/cards/types";
import { filterInjuries, injuryCounts, type InjuryFilter, type InjuryRow } from "@/lib/screens/tools";
import { copyFor } from "@/lib/ui/copy";
import { age } from "@/lib/ui/format";
import {
  column, filterChip, filterCount, filters, newsHead, newsMeta, newsRow, newsText, onSkyKicker, onSkyRow, onSkyTitle,
  panel, sectionAside, statusChip, teamMenu, teamMenuItem, teamMenuList, helpSummary,
} from "@/lib/variants";
import { ThemeToggle } from "../ui/ThemeToggle";
import { ChevronDown } from "../ui/icons";

const FILTERS: readonly InjuryFilter[] = ["all", "injured", "doubtful", "suspended", "unavailable"];
const SHOWN = 40;

interface PlayersProps {
  readonly rows: readonly InjuryRow[];
  readonly status: InjuryFilter;
  readonly team: string | null;
  readonly teams: readonly string[];
  readonly now: number;
  readonly lang: Lang;
}

const href = (status: InjuryFilter, team: string | null) => {
  const query = new URLSearchParams();
  if (status !== "all") query.set("status", status);
  if (team) query.set("team", team);
  const text = query.toString();
  return text ? `/players?${text}` : "/players";
};

export function Players({ rows, status, team, teams, now, lang }: PlayersProps) {
  const t = copyFor(lang);
  const p = t.players;
  const counts = injuryCounts(rows, team);
  const list = filterInjuries(rows, status, team).slice(0, SHOWN);
  const label: Record<InjuryFilter, string> = { all: p.all, injured: p.injured, doubtful: p.doubtful, suspended: p.suspended, unavailable: p.unavailable };
  return (
    <div lang={lang} className={column({ gap: "md" })}>
      <header className={onSkyRow()}>
        <div>
          <h1 className={onSkyTitle()}>{p.title}</h1>
          <span className={onSkyKicker()}>{p.section}</span>
        </div>
        <ThemeToggle labels={{ system: t.theme.label(t.theme.system), light: t.theme.label(t.theme.light), dark: t.theme.label(t.theme.dark) }} />
      </header>

      <nav aria-label={p.filterLabel} className={filters()}>
        {FILTERS.map((f) => (
          <Link key={f} href={href(f, team)} aria-current={f === status ? "true" : undefined} className={filterChip()}>
            {label[f]}
            <span className={filterCount()}>{counts[f]}</span>
          </Link>
        ))}
      </nav>

      <details className={teamMenu()}>
        <summary className={helpSummary()}>
          {team ?? p.allTeams}
          <ChevronDown />
        </summary>
        <div className={teamMenuList()}>
          <Link href={href(status, null)} aria-current={team === null ? "true" : undefined} className={teamMenuItem()}>
            {p.all}
          </Link>
          {teams.map((short) => (
            <Link key={short} href={href(status, short)} aria-current={short === team ? "true" : undefined} className={teamMenuItem()}>
              {short}
            </Link>
          ))}
        </div>
      </details>

      {list.length === 0 ? (
        <p role="status" className={panel({ tone: "note" })}>
          {p.empty}
        </p>
      ) : (
        <ul>
          {list.map((row) => (
            <li key={`${row.player}-${row.team}-${row.reportedAt}`} className={newsRow()}>
              <span className={newsHead()}>
                {row.player}
                <span className={statusChip({ status: row.status })}>
                  {row.status === "doubtful" && row.chance !== null ? `${row.chance}%` : label[row.status]}
                </span>
              </span>
              <span className={newsText()}>{row.news}</span>
              <span className={newsMeta()}>
                {row.team} · {row.position} · {p.ago(age(row.reportedAt, now))}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className={sectionAside()}>{p.snapshot}</p>
    </div>
  );
}
