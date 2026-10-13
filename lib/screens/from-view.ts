// What the screens and cards take from the data session's league view
// (lib/league getLeagueView): the Market, the Table and each card's model.
// Facts only come from the view; words come from lib/i18n and lib/roasts.
import { AWARD_KEYS, type AwardKey } from "@/lib/awards";
import { signed } from "@/lib/cards/copy";
import type { CardModel } from "@/lib/cards/render";
import type { CardKey } from "@/lib/cards/request";
import type { AwardFacts, CardMeta, Manager as CardManager, WrapRow } from "@/lib/cards/types";
import { copyFor, type Lang } from "@/lib/i18n";
import { competitionRanks } from "@/lib/league/standings";
import type { Award, LeagueView } from "@/lib/league/types";
import { groupLineFor, roastFor } from "@/lib/roasts";
import { colours } from "@/lib/tokens";
import { badgeFor } from "@/lib/ui/badge";
import { movedBy } from "@/lib/ui/format";
import type { MarketData, TeamOfTheWeek } from "./market";
import type { TableView } from "./table";

/** Cards name three winners; more become "+N others". */
const NAMED = 3;
/** Middle Class looks at the last 3 gameweeks (D3), so its chart shows 4 points. */
const MIDDLE_WEEKS = 3;
const POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;

const present = (gap: number | null | undefined): gap is number => gap !== null && gap !== undefined;

// ---------------------------------------------------------------- Market and Table

function teamOfTheWeek(view: LeagueView): TeamOfTheWeek {
  const { players, topPlayer } = view.teamOfTheWeek;
  const isTop = (name: string, points: number) => topPlayer !== null && topPlayer.name === name && topPlayer.points === points;
  return {
    lines: POSITIONS.map((position) =>
      players
        .filter((p) => p.position === position)
        .map((p) => ({ name: p.name, points: p.points, ownedBy: p.ownedBy, top: isTop(p.name, p.points) })),
    ).filter((line) => line.length > 0),
  };
}

export function marketFromView(view: LeagueView): MarketData {
  return {
    leagueId: String(view.league.id),
    leagueName: view.league.name.trim(),
    gw: view.gameweek.id,
    provisional: view.gameweek.provisional,
    awards: view.awards.map((award) => award.id),
    teamOfTheWeek: teamOfTheWeek(view),
    rows: view.market.map((row) => ({
      manager: { id: row.manager.id, firstName: row.manager.firstName, teamName: row.manager.teamName },
      you: row.manager.isYou,
      score: row.score,
      leagueRankChange: row.leagueRankChange ?? 0,
      gapSeries: row.gapSeries.filter(present),
      awards: row.awards,
    })),
  };
}

/** The standings after the view's gameweek; managers with no rank yet are left out. */
export function tableFromView(view: LeagueView): TableView {
  return {
    leagueName: view.league.name.trim(),
    truncated: view.truncated,
    rows: view.table.flatMap((row) =>
      row.rank === null
        ? []
        : [
            {
              entry: row.manager.id,
              pos: row.rank,
              move: movedBy(row.movement ?? 0),
              firstName: row.manager.firstName,
              teamName: row.manager.teamName,
              badge: badgeFor(row.manager.teamName),
              gw: row.gwScore?.points ?? 0,
              total: row.total ?? 0,
              you: row.manager.isYou,
            },
          ],
    ),
  };
}

// ---------------------------------------------------------------- Cards

/**
 * A manager's league rank after each gameweek they played. At any gameweek,
 * ordering the league by gap to the average is ordering it by total, so the
 * gaps the view already carries give the ranks (equal totals share, D5).
 */
function rankHistory(view: LeagueView, entry: number): number[] {
  const weeks = Math.max(0, ...view.market.map((row) => row.gapSeries.length));
  return Array.from({ length: weeks }).flatMap((_, i) => {
    const playing = view.market.filter((row) => present(row.gapSeries[i]));
    const at = playing.findIndex((row) => row.manager.id === entry);
    return at < 0 ? [] : [competitionRanks(playing, (row) => row.gapSeries[i] ?? 0)[at]];
  });
}

function cardManager(manager: { readonly firstName: string; readonly teamName: string }): CardManager {
  const badge = badgeFor(manager.teamName);
  return {
    firstName: manager.firstName,
    teamName: manager.teamName,
    badge: { initials: badge.initials, colour: colours.dark[`badge-${badge.colour}`], shape: badge.shape },
  };
}

function factsFor(award: Award, view: LeagueView): AwardFacts {
  const [first] = award.winners;
  const ranked = view.table.filter((row) => row.rank !== null).length;
  const charted = award.winners.slice(0, NAMED);
  switch (award.id) {
    case "oga":
    case "spoon": {
      const row = view.market.find((r) => r.manager.id === first?.manager.id);
      return { award: award.id, net: award.stat, hits: first?.score?.hits ?? 0, gapByGw: (row?.gapSeries ?? []).filter(present) };
    }
    case "climber":
    case "faller":
      return {
        award: award.id,
        places: award.stat,
        from: first?.ranks?.from ?? 0,
        to: first?.ranks?.to ?? 0,
        rankByGw: charted.map((w) => rankHistory(view, w.manager.id)),
        leagueSize: ranked,
      };
    case "middle":
      return {
        award: "middle",
        places: Math.max(0, ...award.winners.map((w) => (w.ranks ? Math.abs(w.ranks.from - w.ranks.to) : 0))),
        weeks: MIDDLE_WEEKS,
        rankByGw: charted.map((w) => rankHistory(view, w.manager.id).slice(-(MIDDLE_WEEKS + 1))),
        leagueSize: ranked,
      };
    case "captain": {
      // The view doesn't carry the team's best player yet; the gameweek's top player stands in.
      const top = view.teamOfTheWeek.topPlayer;
      return {
        award: "captain",
        captain: { name: first?.captain?.name ?? "", points: award.stat },
        best: top ? { name: top.name, points: top.points, scope: "gameweek" } : null,
      };
    }
    case "bench":
      // The view doesn't carry who sat on the bench yet: the card shows the total alone.
      return { award: "bench", total: award.stat, players: [] };
    case "hits":
      return { award: "hits", gross: first?.score?.points ?? 0, paid: award.stat };
  }
}

/** The Wrap's headline number for an award, as the card prints it. */
function wrapValue(award: Award, facts: AwardFacts): string {
  switch (facts.award) {
    case "oga":
    case "spoon":
      return signed(award.stat);
    case "hits":
      return signed(-award.stat);
    case "middle":
      return `±${facts.places}`;
    default:
      return String(award.stat);
  }
}

const metaOf = (view: LeagueView): CardMeta => ({
  leagueName: view.league.name.trim(),
  gw: view.gameweek.id,
  provisional: view.gameweek.provisional,
});

/** One card's model, or null when nobody won that award this gameweek. */
export function cardFromView(view: LeagueView, key: CardKey, lang: Lang): CardModel | null {
  const ctx = { leagueId: view.league.id, gw: view.gameweek.id, lang };
  if (key !== "wrap") {
    const award = view.awards.find((a) => a.id === key);
    if (!award) return null;
    return {
      kind: "award",
      model: { meta: metaOf(view), winners: award.winners.map((w) => cardManager(w.manager)), facts: factsFor(award, view), roast: roastFor(award, ctx) },
    };
  }
  const others = copyFor(lang).card.others;
  const rows = AWARD_KEYS.map((id: AwardKey): WrapRow => {
    const award = view.awards.find((a) => a.id === id);
    if (!award) return { award: id, winners: [], value: null, groupLine: groupLineFor(id, ctx) };
    const names = award.winners.map((w) => w.manager.firstName);
    const facts = factsFor(award, view);
    const movement = id === "climber" ? "up" : id === "faller" ? "down" : undefined;
    return {
      award: id,
      winners: names.length > NAMED ? [...names.slice(0, NAMED), others(names.length - NAMED)] : names,
      value: wrapValue(award, facts),
      ...(movement ? { movement } : {}),
    };
  });
  return { kind: "wrap", model: { meta: metaOf(view), leagueAverage: view.averages.league ?? 0, rows } };
}
