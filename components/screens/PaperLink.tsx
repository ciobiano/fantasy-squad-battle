// "2nd of 11 on paper · Arena of Champions": where a team's squad ranks in the
// remembered league, linking to League · On paper.
import Link from "next/link";
import { copyFor, type Lang } from "@/lib/i18n";
import type { PaperRankView } from "@/lib/screens/planner";
import { chevron, paperLeague, paperPill } from "@/lib/variants";
import { ChevronRight } from "../ui/icons";

export function PaperLink({ rank, lang }: { rank: PaperRankView; lang: Lang }) {
  const p = copyFor(lang).planner;
  return (
    <Link href={rank.href} aria-label={p.paperAria(rank.rank, rank.of, rank.leagueName)} className={paperPill()}>
      <span aria-hidden="true">
        <strong>{p.paperRank(rank.rank, rank.of)}</strong> {p.onPaper}
      </span>
      <span aria-hidden="true" className={paperLeague()}>
        {rank.leagueName}
      </span>
      <ChevronRight className={chevron()} />
    </Link>
  );
}
