// Pick a replacement: every player in the outgoing player's position, ranked by
// what he adds to the team over the rest of the window (lib/planner/engine
// replacementsFor). Players the squad can't take stay in the list, dimmed,
// with the rule that stops them.
import { useMemo, useState } from "react";
import { replacementsFor, type Blocked } from "@/lib/planner/engine";
import { nextFixtures, sellPrice } from "@/lib/screens/plan-board";
import { money, signedDecimal } from "@/lib/ui/format";
import { stripedClubs } from "@/lib/ui/kits";
import {
  column, fieldLabel, input, onSkyTitle, plannerTagline, planBack, planNav, replaceFilters, replaceGain, replaceHead, replaceList,
  replaceRow, replaceRowEnd, replaceRowName, replaceRowSub, replaceRowText, replaceSelect, segment, segmented, statusChip, visuallyHidden,
} from "@/lib/variants";
import { BackIcon } from "../ui/icons";
import { KitPatterns, Shirt } from "../ui/Pitch";
import type { BoardModel } from "./PlanBoard";

type Sort = "gain" | "price" | "form";

/** Rows drawn at once: the best of a position, enough for a phone. Search narrows it. */
const SHOWN = 50;

const plain = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function PlanReplace({ model, out, onBack, onPick }: { model: BoardModel; out: number; onBack: () => void; onPick: (id: number) => void }) {
  const { copy: c, lang, week, ctx, data, players, clubs } = model;
  const outgoing = players.get(out)!;
  const [sort, setSort] = useState<Sort>("gain");
  const [query, setQuery] = useState("");
  const [club, setClub] = useState(0);

  const all = useMemo(() => replacementsFor({ squad: week.squad, bank: week.bank }, out, ctx, week.gw), [week, out, ctx]);
  const shown = useMemo(() => {
    const q = plain(query.trim());
    const list = all.filter((r) => (club === 0 || players.get(r.id)?.club === club) && (q === "" || plain(players.get(r.id)?.name ?? "").includes(q)));
    const byForm = (id: number) => players.get(id)?.form ?? 0;
    const sorted = sort === "gain" ? list : [...list].sort((a, b) => (sort === "price" ? b.price - a.price : byForm(b.id) - byForm(a.id)));
    return sorted.slice(0, SHOWN);
  }, [all, club, query, sort, players]);

  const budget = week.bank + sellPrice(week, out, ctx);
  const window = c.window(week.gw, data.gws[data.gws.length - 1]);
  const reason = (b: Blocked) => (b.kind === "over-budget" ? c.overBudget(money(b.short, lang)) : c.clubLimit(data.rules.clubLimit, clubs.get(b.club)?.name ?? ""));

  return (
    <div lang={lang} className={column({ gap: "sm" })}>
      <nav aria-label={c.title} className={planNav()}>
        <button type="button" className={planBack()} onClick={onBack}>
          <BackIcon />
          {c.title}
        </button>
      </nav>
      <header>
        <h1 className={onSkyTitle()}>{c.replaceTitle(outgoing.name)}</h1>
        <p className={plannerTagline()}>{c.replaceSub(c.positions[outgoing.position], money(budget, lang))}</p>
      </header>

      <div className={replaceFilters()}>
        <label htmlFor="replace-q" className={visuallyHidden()}>
          {c.search(c.positionsPlural[outgoing.position])}
        </label>
        <input
          id="replace-q"
          type="search"
          autoComplete="off"
          value={query}
          placeholder={c.search(c.positionsPlural[outgoing.position])}
          className={input()}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div role="radiogroup" aria-label={c.sortBy} className={segmented()}>
          {(["gain", "price", "form"] as const).map((s) => (
            <button key={s} type="button" role="radio" aria-checked={sort === s} className={segment({ size: "sm" })} onClick={() => setSort(s)}>
              {c.sorts[s]}
            </button>
          ))}
        </div>
        <label htmlFor="replace-club" className={fieldLabel()}>
          <span className={visuallyHidden()}>{c.club}</span>
          <select id="replace-club" value={club} className={replaceSelect()} onChange={(event) => setClub(Number(event.target.value))}>
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
      <section aria-labelledby="replace-h">
        <h2 id="replace-h" className={visuallyHidden()}>
          {c.columnGain(window)}
        </h2>
        <div aria-hidden="true" className={replaceHead()}>
          <span>{c.columnPlayer}</span>
          <span>{c.columnGain(window)}</span>
        </div>
        {shown.length === 0 ? <p className={replaceRowSub()}>{c.nobody}</p> : null}
        <ul className={replaceList()}>
          {shown.map((r) => {
            const p = players.get(r.id)!;
            const short = clubs.get(p.club)?.short ?? "";
            const blocked = r.blocked.length > 0;
            const reasons = r.blocked.map(reason).join(" · ");
            const gain = signedDecimal(r.gain, lang);
            const doubtful = p.status === "d" && p.chance !== null;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  disabled={blocked}
                  aria-label={blocked ? c.blockedAria(p.name, reasons) : c.rowAria(p.name, short, money(r.price, lang), gain)}
                  className={replaceRow()}
                  onClick={() => onPick(r.id)}
                >
                  <Shirt club={short} />
                  <span aria-hidden="true" className={replaceRowText()}>
                    <span className={replaceRowName()}>
                      {p.name}
                      {doubtful ? <span className={statusChip({ status: "doubtful" })}>{c.chance(p.chance ?? 0)}</span> : null}
                    </span>
                    <span className={replaceRowSub({ blocked })}>{blocked ? reasons : `${short} · ${nextFixtures(data, p.club, week.gw, 3, model.words)}`}</span>
                  </span>
                  <span aria-hidden="true" className={replaceRowEnd()}>
                    <span className={replaceGain({ tone: blocked || r.gain <= 0 ? "quiet" : "up" })}>{gain}</span>
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
