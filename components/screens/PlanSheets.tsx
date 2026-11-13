// The plan board's sheets: a player (transfer him out, start him, captain him),
// a transfer side by side (with the hit, and "free next week" when waiting is
// worth more), and the chips for the week.
import { useMemo } from "react";
import type { Chip, Transfer, WeekPlan } from "@/lib/planner/engine";
import {
  chipOpen, chipState, fixtureLabel, nextTransferCost, sellPrice, setCaptain, setChip, startFromBench, startPlayer,
  transferOptions,
} from "@/lib/screens/plan-board";
import { decimal, money, signedDecimal, weekdayText } from "@/lib/ui/format";
import {
  bar, barChart, barColumn, barFill, barGw, barStack, barLabel, barOpp, barTrack, barValue, button, chevron, chipName, chipSub, fact, factLabel, factRow,
  factValue, group, listRow, outlineButton, panelBody, ratingFigure, ratingUnit, sheetActions, sheetClose, sheetHeader, sheetHeaderText,
  sheetMeta, sheetName, sheetNews, sheetShirt, sheetTitle, trendChip, compareGain, compareSides, compareSide, compareTag, compareName,
  compareLedger, compareLedgerRow, compareTip, costValue, legendKey, legendKeys, legendDot,
} from "@/lib/variants";
import { CloseIcon, ChevronRight } from "../ui/icons";
import { Shirt } from "../ui/Pitch";
import { Sheet } from "../ui/Sheet";
import type { BoardModel } from "./PlanBoard";

/** Bars share one scale (0–7 points) so players compare at a glance. */
const SCALE = 7;

const step = (points: number) => Math.max(1, Math.min(14, Math.round((points / SCALE) * 14))) as 1;

function Bars({ values, labels, gws, model }: { values: readonly number[]; labels: readonly string[]; gws: readonly number[]; model: BoardModel }) {
  return (
    <ol className={barChart()}>
      {values.map((v, i) => (
        <li key={gws[i]} className={barColumn()} aria-label={`${model.copy.gw(gws[i])}: ${labels[i]} ${decimal(v, model.lang)}`}>
          <span aria-hidden="true" className={barStack()}>
            <span className={barValue()}>{decimal(v, model.lang)}</span>
            <span className={bar({ step: step(v) })} />
          </span>
          <span aria-hidden="true" className={barLabel()}>
            <span className={barOpp()}>{labels[i]}</span>
            <span className={barGw()}>{model.copy.gw(gws[i])}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------- A player

export function PlayerSheet({ model, id, onClose, onTransferOut, onChange }: {
  model: BoardModel;
  id: number;
  onClose: () => void;
  onTransferOut: () => void;
  onChange: (next: WeekPlan[]) => void;
}) {
  const { copy: c, lang, week, ctx, data, players, clubs } = model;
  const p = players.get(id)!;
  const onBench = week.bench.includes(id);
  const club = clubs.get(p.club);
  const total = p.points.reduce((a, b) => a + b, 0);
  const trend = p.priceTrend;
  const canStart = onBench && startFromBench(week, id, ctx) !== null;
  return (
    <Sheet open onClose={onClose} labelledBy="player-h">
      <header className={sheetHeader()}>
        <span className={sheetShirt()}>
          <Shirt club={club?.short ?? ""} />
        </span>
        <span className={sheetHeaderText()}>
          <h2 id="player-h" className={sheetName()}>
            {p.name}
          </h2>
          <span className={sheetMeta()}>
            {[club?.name, c.positions[p.position], onBench ? c.onBench : null].filter(Boolean).join(" · ")}
          </span>
        </span>
        <button type="button" aria-label={c.close} className={sheetClose()} onClick={onClose}>
          <CloseIcon />
        </button>
      </header>

      <dl className={factRow()}>
        {[
          [c.price, money(p.price, lang)],
          [c.sell, money(sellPrice(week, id, ctx), lang)],
          [c.form, decimal(p.form, lang)],
          [c.owned, `${Math.round(p.ownership)}%`],
        ].map(([label, value]) => (
          <div key={label} className={fact()}>
            <dt className={factLabel()}>{label}</dt>
            <dd className={factValue()}>{value}</dd>
          </div>
        ))}
      </dl>
      {trend ? (
        <span className={trendChip({ direction: trend.direction })}>
          {trend.direction === "rise" ? c.rising(trend.at ? weekdayText(trend.at, lang) : null) : c.falling(trend.at ? weekdayText(trend.at, lang) : null)}
        </span>
      ) : null}
      {p.news ? <p className={sheetNews()}>{p.news}</p> : null}

      <section aria-labelledby="proj-h">
        <div className={sheetHeader()}>
          <h3 id="proj-h" className={sheetTitle()}>
            {c.projected}
          </h3>
          <span className={sheetMeta()}>{c.projectedTotal(decimal(total, lang), c.window(data.gws[0], data.gws[data.gws.length - 1]))}</span>
        </div>
        <Bars values={p.points} labels={data.gws.map((gw) => fixtureLabel(data, p.club, gw, model.words))} gws={data.gws} model={model} />
      </section>

      <div className={sheetActions()}>
        <button type="button" className={button({ intent: "primary" })} onClick={onTransferOut}>
          {c.transferOut}
        </button>
        {onBench ? (
          <button type="button" disabled={!canStart} className={outlineButton()} onClick={() => {
            const next = startPlayer(model.plan, week, id, ctx);
            if (next) onChange(next);
          }}>
            {c.startHim}
          </button>
        ) : id !== week.captain ? (
          <button type="button" className={outlineButton()} onClick={() => onChange(setCaptain(model.plan, week, id))}>
            {c.makeCaptain}
          </button>
        ) : null}
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------- A transfer, side by side

export function CompareSheet({ model, t, onClose, onAdd }: { model: BoardModel; t: Transfer; onClose: () => void; onAdd: (gw: number) => void }) {
  const { copy: c, lang, week, ctx, data, players, clubs, start, plan } = model;
  const [out, into] = [players.get(t.out)!, players.get(t.in)!];
  const gws = data.gws.filter((gw) => gw >= week.gw);
  const from = data.gws.indexOf(week.gw);
  const options = useMemo(() => transferOptions(start, plan, week.gw, t, ctx), [start, plan, week.gw, t, ctx]);
  const hit = nextTransferCost(week, data.rules.hitCost);
  const window = c.window(week.gw, data.gws[data.gws.length - 1]);
  const bankAfter = week.bank + sellPrice(week, t.out, ctx) - into.price;
  const sum = (points: readonly number[]) => points.slice(from).reduce((a, b) => a + b, 0);
  const wait = options.later && options.later.gain > options.now + 0.05 ? options.later : null;
  return (
    <Sheet open onClose={onClose} labelledBy="compare-h">
      <header className={sheetHeader()}>
        <span className={sheetHeaderText()}>
          <h2 id="compare-h" className={sheetName()}>
            {c.compareTitle(into.name, out.name)}
          </h2>
        </span>
        <button type="button" aria-label={c.close} className={sheetClose()} onClick={onClose}>
          <CloseIcon />
        </button>
      </header>

      <div className={compareSides()}>
        {[
          { tag: c.out, tone: "out" as const, p: out, price: c.sellFor(money(sellPrice(week, t.out, ctx), lang)) },
          { tag: c.in, tone: "in" as const, p: into, price: c.buyFor(money(into.price, lang)) },
        ].map((side) => (
          <div key={side.tag} className={compareSide()}>
            <Shirt club={clubs.get(side.p.club)?.short ?? ""} />
            <span className={sheetHeaderText()}>
              <span className={compareTag({ tone: side.tone })}>{side.tag}</span>
              <span className={compareName()}>{side.p.name}</span>
              <span className={sheetMeta()}>{side.price}</span>
            </span>
          </div>
        ))}
      </div>

      <section aria-labelledby="cmp-proj">
        <div className={sheetHeader()}>
          <h3 id="cmp-proj" className={sheetTitle()}>
            {c.projected}
          </h3>
          <span className={legendKeys()}>
            <span className={legendKey()}>
              <span aria-hidden="true" className={legendDot({ tone: "out" })} />
              {out.name} {decimal(sum(out.points), lang)}
            </span>
            <span className={legendKey()}>
              <span aria-hidden="true" className={legendDot({ tone: "in" })} />
              {into.name} {decimal(sum(into.points), lang)}
            </span>
          </span>
        </div>
        <ol className={barChart()}>
          {gws.map((gw, i) => {
            const [a, b] = [out.points[from + i] ?? 0, into.points[from + i] ?? 0];
            return (
              <li key={gw} className={barColumn()} aria-label={`${c.gw(gw)}: ${out.name} ${decimal(a, lang)}, ${into.name} ${decimal(b, lang)}`}>
                <svg viewBox="0 0 22 64" preserveAspectRatio="none" aria-hidden="true" className={barTrack()}>
                  <rect x="2" y={64 - Math.min(1, a / SCALE) * 64} width="8" height={Math.min(1, a / SCALE) * 64} rx="1.5" className={barFill({ tone: "out" })} />
                  <rect x="12" y={64 - Math.min(1, b / SCALE) * 64} width="8" height={Math.min(1, b / SCALE) * 64} rx="1.5" className={barFill({ tone: "in" })} />
                </svg>
                <span aria-hidden="true" className={barGw()}>
                  {c.gw(gw)}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <p className={ratingFigure()}>
        <span className={compareGain()}>{signedDecimal(options.now, lang)}</span>
        <span className={ratingUnit()}>{hit > 0 ? c.gainAfterHit(hit, window) : c.gainNote(window)}</span>
      </p>

      <dl className={compareLedger()}>
        <div className={compareLedgerRow()}>
          <dt>{c.cost}</dt>
          <dd className={costValue({ hit: hit > 0 })}>{hit > 0 ? c.costHit(hit) : c.costFree}</dd>
        </div>
        <div className={compareLedgerRow()}>
          <dt>{c.bankAfter}</dt>
          <dd>{c.estimate(money(bankAfter, lang))}</dd>
        </div>
      </dl>

      {wait ? (
        <div className={compareTip()}>
          <p className={panelBody()}>{c.waitTip(wait.gw, signedDecimal(wait.gain, lang))}</p>
          <button type="button" className={outlineButton()} onClick={() => onAdd(wait.gw)}>
            {c.moveTo(wait.gw)}
          </button>
        </div>
      ) : null}

      <button type="button" className={button({ intent: "primary" })} onClick={() => onAdd(week.gw)}>
        {hit > 0 ? c.addHit(hit) : c.add}
      </button>
    </Sheet>
  );
}

// ---------------------------------------------------------------- Chips

const CHIPS: readonly Chip[] = ["bboost", "3xc", "freehit", "wildcard"];

export function ChipsSheet({ model, onClose, onChange }: { model: BoardModel; onClose: () => void; onChange: (next: WeekPlan[]) => void }) {
  const { copy: c, lang, week, ctx, start, plan, players, data } = model;
  const firstHalf = data.rules.chips.find((w) => w.from <= week.gw && week.gw <= w.to);
  return (
    <Sheet open onClose={onClose} labelledBy="chips-sheet-h">
      <header className={sheetHeader()}>
        <span className={sheetHeaderText()}>
          <h2 id="chips-sheet-h" className={sheetName()}>
            {c.chipsTitle}
          </h2>
          <span className={sheetMeta()}>{c.chipsWeek(week.gw)}</span>
        </span>
        <button type="button" aria-label={c.close} className={sheetClose()} onClick={onClose}>
          <CloseIcon />
        </button>
      </header>
      <ul className={group()}>
        {CHIPS.map((chip) => {
          const state = chipState(chip, week, start, plan, ctx);
          const back = data.rules.chips.find((w) => w.chip === chip && w.from > week.gw)?.from ?? null;
          const sub =
            state.kind === "used"
              ? c.chipUsedLong(state.gw, back)
              : chip === "3xc"
                ? c.chipSubs["3xc"](players.get(week.captain)?.name ?? "")
                : c.chipSubs[chip];
          const playable = state.kind === "playing" || chipOpen(chip, week.gw, start, plan, ctx);
          return (
            <li key={chip}>
              <button
                type="button"
                disabled={!playable}
                className={listRow()}
                onClick={() => onChange(setChip(plan, week.gw, state.kind === "playing" ? null : chip))}
              >
                <span className={sheetHeaderText()}>
                  <span className={chipName()}>{state.kind === "playing" ? `${c.chips[chip]} · ${c.cancelChip}` : c.chips[chip]}</span>
                  <span className={chipSub({ tone: state.kind === "used" || !playable ? "off" : "quiet" })}>{sub}</span>
                </span>
                {state.kind === "gain" ? <span className={chipSub({ tone: "gain" })}>{signedDecimal(state.points, lang)}</span> : null}
                {playable ? <ChevronRight className={chevron()} /> : null}
              </button>
            </li>
          );
        })}
      </ul>
      {firstHalf ? <p className={sheetMeta()}>{c.chipNote(firstHalf.to)}</p> : null}
    </Sheet>
  );
}
