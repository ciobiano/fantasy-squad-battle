// A position's players to pick from: search, sort, a club filter, and a row per
// player with what he's worth to the squad. Players the squad can't take stay
// in the list, dimmed, with the rule that stops them. Used to replace a player
// on the plan board (PlanReplace) and to fill a shirt in a draft (DraftBoard).
import { useMemo, useState } from "react";
import type { Blocked, Position } from "@/lib/planner/engine";
import { nextFixtures } from "@/lib/screens/plan-board";
import { money } from "@/lib/ui/format";
import { stripedClubs } from "@/lib/ui/kits";
import {
  column, fieldLabel, input, onSkyTitle, plannerTagline, planBack, planNav, replaceFilters, replaceGain, replaceHead, replaceList,
  replaceRow, replaceRowEnd, replaceRowName, replaceRowSub, replaceRowText, replaceSelect, segment, segmented, statusChip, visuallyHidden,
} from "@/lib/variants";
import { BackIcon } from "../ui/icons";
import { KitPatterns, Shirt } from "../ui/Pitch";
import type { BoardModel } from "./PlanBoard";

export type PickerModel = Pick<BoardModel, "copy" | "lang" | "data" | "players" | "clubs" | "words">;

export interface PickRow {
  readonly id: number;
  /** What the row is ranked by (gain for the team, or projected points), most first. */
  readonly value: number;
  readonly price: number;
  readonly blocked: readonly Blocked[];
}

/** How the rows' value reads: its sort label, column heading, and how it's shown. */
export interface PickValue {
  readonly sort: string;
  readonly column: string;
  readonly show: (value: number) => string;
  /** Green when it helps (a gain); otherwise the plain ink. */
  readonly tone: (value: number) => "up" | "quiet" | "plain";
}

type Sort = "value" | "price" | "form";

/** Rows drawn at once: the best of a position, enough for a phone. Search narrows it. */
const SHOWN = 50;

const plain = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function PlayerPicker({ model, gw, position, title, sub, back, rows, value, onBack, onPick }: {
  model: PickerModel;
  /** The gameweek the fixtures start from. */
  gw: number;
  position: Position;
  title: string;
  sub: string;
  back: string;
  rows: readonly PickRow[];
  value: PickValue;
  onBack: () => void;
  onPick: (id: number) => void;
}) {
  const { copy: c, lang, data, players, clubs } = model;
  const [sort, setSort] = useState<Sort>("value");
  const [query, setQuery] = useState("");
  const [club, setClub] = useState(0);

  const shown = useMemo(() => {
    const q = plain(query.trim());
    const list = rows.filter((r) => (club === 0 || players.get(r.id)?.club === club) && (q === "" || plain(players.get(r.id)?.name ?? "").includes(q)));
    const byForm = (id: number) => players.get(id)?.form ?? 0;
    const sorted = sort === "value" ? list : [...list].sort((a, b) => (sort === "price" ? b.price - a.price : byForm(b.id) - byForm(a.id)));
    return sorted.slice(0, SHOWN);
  }, [rows, club, query, sort, players]);

  const reason = (b: Blocked) => (b.kind === "over-budget" ? c.overBudget(money(b.short, lang)) : c.clubLimit(data.rules.clubLimit, clubs.get(b.club)?.name ?? ""));
  const sorts: readonly (readonly [Sort, string])[] = [["value", value.sort], ["price", c.sorts.price], ["form", c.sorts.form]];

  return (
    <div lang={lang} className={column({ gap: "sm" })}>
      <nav aria-label={back} className={planNav()}>
        <button type="button" className={planBack()} onClick={onBack}>
          <BackIcon />
          {back}
        </button>
      </nav>
      <header>
        <h1 className={onSkyTitle()}>{title}</h1>
        <p className={plannerTagline()}>{sub}</p>
      </header>

      <div className={replaceFilters()}>
        <label htmlFor="pick-q" className={visuallyHidden()}>
          {c.search(c.positionsPlural[position])}
        </label>
        <input
          id="pick-q"
          type="search"
          autoComplete="off"
          value={query}
          placeholder={c.search(c.positionsPlural[position])}
          className={input()}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div role="radiogroup" aria-label={c.sortBy} className={segmented()}>
          {sorts.map(([key, label]) => (
            <button key={key} type="button" role="radio" aria-checked={sort === key} className={segment()} onClick={() => setSort(key)}>
              {label}
            </button>
          ))}
        </div>
        <label htmlFor="pick-club" className={fieldLabel()}>
          <span className={visuallyHidden()}>{c.club}</span>
          <select id="pick-club" value={club} className={replaceSelect()} onChange={(event) => setClub(Number(event.target.value))}>
            <option value={0}>{c.allClubs}</option>
            {data.clubs.map((cl) => (
              <option key={cl.id} value={cl.id}>
                {cl.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <KitPatterns clubs={stripedClubs(data.clubs.map((cl) => cl.short))} />
      <section aria-labelledby="pick-h">
        <h2 id="pick-h" className={visuallyHidden()}>
          {value.column}
        </h2>
        <div aria-hidden="true" className={replaceHead()}>
          <span>{c.columnPlayer}</span>
          <span>{value.column}</span>
        </div>
        {shown.length === 0 ? <p className={replaceRowSub()}>{c.nobody}</p> : null}
        <ul className={replaceList()}>
          {shown.map((r) => {
            const p = players.get(r.id)!;
            const short = clubs.get(p.club)?.short ?? "";
            const blocked = r.blocked.length > 0;
            const reasons = r.blocked.map(reason).join(" · ");
            const shownValue = value.show(r.value);
            const doubtful = p.status === "d" && p.chance !== null;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  disabled={blocked}
                  aria-label={blocked ? c.blockedAria(p.name, reasons) : c.rowAria(p.name, short, money(r.price, lang), shownValue)}
                  className={replaceRow()}
                  onClick={() => onPick(r.id)}
                >
                  <Shirt club={short} />
                  <span aria-hidden="true" className={replaceRowText()}>
                    <span className={replaceRowName()}>
                      {p.name}
                      {doubtful ? <span className={statusChip({ status: "doubtful" })}>{c.chance(p.chance ?? 0)}</span> : null}
                    </span>
                    <span className={replaceRowSub({ blocked })}>{blocked ? reasons : `${short} · ${nextFixtures(data, p.club, gw, 3, model.words)}`}</span>
                  </span>
                  <span aria-hidden="true" className={replaceRowEnd()}>
                    <span className={replaceGain({ tone: blocked ? "quiet" : value.tone(r.value) })}>{shownValue}</span>
                    <span className={replaceRowSub()}>{money(r.price, lang)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
