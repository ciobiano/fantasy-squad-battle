// Your league, under the rating: grouped rows that each do one thing.
//   Compare in [Arena of Champions ⌃⌄]   picks the league, staying here
//   (2) 2nd best squad of 11              the squad's rank on paper, streamed
//   See the On paper table ›              goes to League · On paper
import Link from "next/link";
import type { ReactNode } from "react";
import { copyFor, type Lang } from "@/lib/i18n";
import { compareHref, type CompareLeague, type PaperRankView } from "@/lib/screens/planner";
import { chevron, leagueGroup, leagueRow, paperRankBadge, paperRankQuiet, sectionHead, sectionHeading } from "@/lib/variants";
import { ChevronRight } from "../ui/icons";
import { LeaguePicker } from "./LeaguePicker";
import { RankPlaceholder } from "./RankPlaceholder";

export function YourLeague({ teamId, leagues, current, lang, rank }: {
  teamId: number;
  leagues: readonly CompareLeague[];
  current: CompareLeague;
  lang: Lang;
  /** The rank row's content, streamed in its own Suspense (see RankFallback). */
  rank: ReactNode;
}) {
  const p = copyFor(lang).planner;
  const options = leagues.map((l) => ({
    id: l.id,
    name: l.name,
    members: l.members,
    href: compareHref(teamId, l.id),
    aria: p.leagueAria(l.name, l.members),
    loading: p.paperRanking(l.name),
  }));
  return (
    <section aria-labelledby="league-h">
      <div className={sectionHead()}>
        <h2 id="league-h" className={sectionHeading()}>
          {p.yourLeague}
        </h2>
      </div>
      <div className={leagueGroup()}>
        <LeaguePicker label={p.compareIn} options={options} current={current.id}>
          {rank}
        </LeaguePicker>
        <Link href={`/league/${current.id}/paper`} className={leagueRow({ rule: true, press: "bottom", spread: true })}>
          {p.seePaper}
          <ChevronRight className={chevron()} />
        </Link>
      </div>
    </section>
  );
}

/** "(2) 2nd best squad of 11", or why there's no rank. */
export function PaperRank({ rank, lang }: { rank: PaperRankView | null; lang: Lang }) {
  const p = copyFor(lang).planner;
  if (!rank) return <span className={paperRankQuiet()}>{p.paperUnavailable}</span>;
  return (
    <>
      <span aria-hidden="true" className={paperRankBadge({ top: rank.rank === 1 })}>
        {rank.rank}
      </span>
      {p.paperLine(rank.rank, rank.of)}
    </>
  );
}

export function RankFallback({ league, lang }: { league: string; lang: Lang }) {
  return <RankPlaceholder label={copyFor(lang).planner.paperRanking(league)} />;
}
