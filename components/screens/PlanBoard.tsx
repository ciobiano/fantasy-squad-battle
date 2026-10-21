"use client";

// The plan board (/planner/{id}/plan): one gameweek at a time, its line-up on
// the pitch, the money and transfers left, and chips. Every change runs through
// the rules engine on the phone (lib/planner/engine), can be undone, and is
// kept on this phone. Picking a replacement and reviewing the plan open over
// the board; the browser's back button closes them.
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { planCopyFor } from "@/lib/i18n/plan";
import type { Lang } from "@/lib/i18n";
import { simulatePlan, type Chip, type Transfer, type WeekPlan, type WeekResult } from "@/lib/planner/engine";
import {
  addTransfer, chipState, contextFor, emptyPlan, fixtureLabel, freeLeft, planKey, playerMap, readPlan, rowsOf, shownPoints, writePlan,
} from "@/lib/screens/plan-board";
import type { PlanBoardView } from "@/lib/screens/planner";
import { decimal, deadlineText, money, signedDecimal } from "@/lib/ui/format";
import {
  chipCard, chipGrid, chipName, chipSub, column, gwTab, gwTabLabel, gwTabPoints, gwTabs, onSkyTitle, planBack, planBar, planBarButton,
  planBarGain, planBarPoints, planBarSpace, planBarSub, planDeadline, planFootnote, planHint, planMove, planMoveCost, planMoves, planNav,
  planStat, planStatLabel, planStatNote, planStats, planStatValue, planTool, planTools, sectionAside, sectionHead, sectionHeading,
} from "@/lib/variants";
import { ArrowRight, BackIcon, RedoIcon, UndoIcon } from "../ui/icons";
import { PlanBench, PlanPitch, type PlanToken } from "./PlanPitch";
import { PlanReplace } from "./PlanReplace";
import { PlanReview } from "./PlanReview";
import { ChipsSheet, CompareSheet, PlayerSheet } from "./PlanSheets";

const CHIPS: readonly Chip[] = ["bboost", "3xc", "freehit", "wildcard"];

type Screen = { readonly kind: "board" } | { readonly kind: "replace"; readonly out: number } | { readonly kind: "review" };
type SheetState = null | { readonly kind: "player"; readonly id: number } | { readonly kind: "compare"; readonly t: Transfer } | { readonly kind: "chips" };

// Plans kept on the phone. When storage is blocked (a private window) they live in memory for the visit.
const PLAN_EVENT = "fsb-plan";
const memory = new Map<string, string>();

function storedPlan(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

function savePlan(key: string, value: string) {
  memory.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    // Kept in memory only.
  }
  window.dispatchEvent(new Event(PLAN_EVENT));
}

function subscribePlans(onChange: () => void) {
  window.addEventListener(PLAN_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(PLAN_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function PlanBoard({ view, lang }: { view: PlanBoardView; lang: Lang }) {
  const c = planCopyFor(lang);
  const { data } = view;
  const team = data.team!;
  const start = team.start;
  const ctx = useMemo(() => contextFor(data), [data]);
  const players = useMemo(() => playerMap(data), [data]);
  const clubs = useMemo(() => new Map(data.clubs.map((club) => [club.id, club])), [data]);
  const words = useMemo(() => ({ home: c.home, away: c.away, blank: c.blank }), [c]);
  const key = planKey(team.id, data.gws[0]);

  // The plan lives on this phone (lib/screens/plan-board: planKey); the board reads it from there.
  const stored = useSyncExternalStore(subscribePlans, () => storedPlan(key), () => null);
  const present = useMemo(() => readPlan(stored, data.gws, players), [stored, data.gws, players]);
  const [undoStack, setUndoStack] = useState<readonly string[]>([]);
  const [redoStack, setRedoStack] = useState<readonly string[]>([]);
  const [gwIndex, setGwIndex] = useState(0);
  const [screen, setScreen] = useState<Screen>({ kind: "board" });
  const [sheet, setSheet] = useState<SheetState>(null);

  // A transfer idea from the rating opens the board with it planned; the link then loses ?idea, so a reload keeps your changes.
  useEffect(() => {
    if (!view.idea) return;
    let plan = emptyPlan(data.gws);
    for (const t of view.idea) plan = addTransfer(plan, data.gws[0], t);
    savePlan(key, writePlan(plan));
    window.history.replaceState(window.history.state, "", window.location.pathname);
  }, [data.gws, key, view.idea]);

  // Back closes the replacement list or the review instead of leaving the planner.
  useEffect(() => {
    const onPop = () => {
      setScreen({ kind: "board" });
      setSheet(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const open = (next: Screen) => {
    window.history.pushState({ plan: next.kind }, "");
    setSheet(null);
    setScreen(next);
    window.scrollTo(0, 0);
  };
  const back = () => window.history.back();

  const current = writePlan(present);
  const commit = (next: WeekPlan[]) => {
    setUndoStack((u) => [...u, current]);
    setRedoStack([]);
    savePlan(key, writePlan(next));
  };
  const undo = () => {
    const previous = undoStack[undoStack.length - 1];
    if (previous === undefined) return;
    setUndoStack((u) => u.slice(0, -1));
    setRedoStack((r) => [current, ...r]);
    savePlan(key, previous);
  };
  const redo = () => {
    const nextPlan = redoStack[0];
    if (nextPlan === undefined) return;
    setRedoStack((r) => r.slice(1));
    setUndoStack((u) => [...u, current]);
    savePlan(key, nextPlan);
  };
  const history = { present, past: undoStack, future: redoStack };

  const result = useMemo(() => simulatePlan(start, history.present, ctx), [start, history.present, ctx]);
  const base = useMemo(() => simulatePlan(start, emptyPlan(data.gws), ctx), [start, data.gws, ctx]);
  const week = result.weeks[gwIndex] ?? result.weeks[0];
  const first = data.gws[0];
  const last = data.gws[data.gws.length - 1];
  const changed = history.present.some((w) => w.transfers.length > 0 || w.chip || w.starters || w.captain !== undefined);

  const tokenFor = (id: number): PlanToken => {
    const p = players.get(id)!;
    const fixture = fixtureLabel(data, p.club, week.gw, words);
    const role = id === week.captain ? "captain" : id === week.vice ? "vice" : null;
    const points = decimal(shownPoints(week, id, ctx), lang);
    return {
      id,
      name: p.name,
      club: clubs.get(p.club)?.short ?? "",
      points,
      fixture,
      role: role === "captain" ? c.captainBadge : role === "vice" ? c.viceBadge : null,
      captain: role === "captain",
      isNew: !start.squad.some((o) => o.id === id),
      aria: c.tokenAria(p.name, role, fixture, points),
    };
  };

  const model = { data, ctx, players, clubs, lang, copy: c, words, start, week, plan: history.present };

  if (screen.kind === "replace") {
    return (
      <>
        <PlanReplace model={model} out={screen.out} onBack={back} onPick={(into) => setSheet({ kind: "compare", t: { out: screen.out, in: into } })} />
        {sheet?.kind === "compare" ? (
          <CompareSheet
            model={model}
            t={sheet.t}
            onClose={() => setSheet(null)}
            onAdd={(gw) => {
              commit(addTransfer(history.present, gw, sheet.t));
              setGwIndex(Math.max(0, data.gws.indexOf(gw)));
              back();
            }}
          />
        ) : null}
      </>
    );
  }
  if (screen.kind === "review") {
    return <PlanReview model={model} result={result} base={base} onBack={back} />;
  }

  const rows = rowsOf(week.starters, players).map((row) => row.map(tokenFor));
  const benchTokens = week.bench.map(tokenFor);
  const left = freeLeft(week);
  const hitPoints = week.hits * data.rules.hitCost;
  const totalHits = result.weeks.reduce((sum, w) => sum + w.hits, 0) * data.rules.hitCost;
  const totalTransfers = result.weeks.reduce((sum, w) => sum + w.transfers.length, 0);

  return (
    <div lang={lang} className={column({ gap: "sm" })}>
      <nav aria-label={c.title} className={planNav()}>
        <Link href={`/planner/${team.id}`} className={planBack()}>
          <BackIcon />
          {c.back}
        </Link>
        <span className={planTools()}>
          <button type="button" aria-label={c.undo} disabled={history.past.length === 0} className={planTool()} onClick={undo}>
            <UndoIcon />
          </button>
          <button type="button" aria-label={c.redo} disabled={history.future.length === 0} className={planTool()} onClick={redo}>
            <RedoIcon />
          </button>
        </span>
      </nav>
      <h1 className={onSkyTitle()}>{c.title}</h1>

      <div role="tablist" aria-label={c.gwTabs} className={gwTabs()}>
        {result.weeks.map((w, i) => (
          <button
            key={w.gw}
            type="button"
            role="tab"
            aria-selected={i === gwIndex}
            aria-label={c.gwAria(w.gw, decimal(w.points, lang))}
            className={gwTab()}
            onClick={() => setGwIndex(i)}
          >
            <span aria-hidden="true" className={gwTabLabel()}>
              {c.gw(w.gw)}
            </span>
            <span aria-hidden="true" className={gwTabPoints()}>
              {decimal(w.points, lang)}
            </span>
          </button>
        ))}
      </div>
      {gwIndex === 0 && data.deadline ? <p className={planDeadline()}>{c.deadline(deadlineText(data.deadline, lang))}</p> : null}

      <dl className={planStats()}>
        <div className={planStat()}>
          <dt className={planStatLabel()}>{c.freeTransfers}</dt>
          <dd className={planStatValue()}>
            {left === null ? "∞" : left}
            <span className={planStatNote()}>{c.est}</span>
          </dd>
        </div>
        <div className={planStat()}>
          <dt className={planStatLabel()}>{c.bank}</dt>
          <dd className={planStatValue()}>
            {money(week.bank, lang)}
            <span className={planStatNote()}>{c.est}</span>
          </dd>
        </div>
        <div className={planStat()}>
          <dt className={planStatLabel()}>{c.hits}</dt>
          <dd className={planStatValue()}>{hitPoints > 0 ? c.hit(hitPoints) : 0}</dd>
        </div>
      </dl>

      {week.transfers.length > 0 ? (
        <ul className={planMoves()}>
          {week.transfers.map((t, i) => {
            const paid = week.chip !== "wildcard" && week.chip !== "freehit" && i >= week.freeTransfers;
            return (
              <li key={`${t.out}-${t.in}`} className={planMove()} aria-label={c.moveAria(players.get(t.out)?.name ?? "", players.get(t.in)?.name ?? "")}>
                <span aria-hidden="true">
                  {players.get(t.out)?.name} <ArrowRight /> {players.get(t.in)?.name}
                </span>
                <span className={planMoveCost({ hit: paid })}>{paid ? c.hit(data.rules.hitCost) : c.free}</span>
              </li>
            );
          })}
        </ul>
      ) : !changed ? (
        <p className={planHint()}>{c.hint}</p>
      ) : null}

      <PlanPitch
        rows={rows}
        clubs={data.clubs.map((cl) => cl.short)}
        label={c.startingXI}
        words={c}
        onPick={(id) => setSheet({ kind: "player", id })}
      />
      <PlanBench tokens={benchTokens} heading={c.benchHeading} words={c} onPick={(id) => setSheet({ kind: "player", id })} />

      <section aria-labelledby="chips-h">
        <div className={sectionHead()}>
          <h2 id="chips-h" className={sectionHeading()}>
            {c.chipsHeading}
          </h2>
          <ChipsAside model={model} />
        </div>
        <div className={chipGrid()}>
          {CHIPS.map((chip) => (
            <ChipButton key={chip} chip={chip} model={model} onOpen={() => setSheet({ kind: "chips" })} />
          ))}
        </div>
      </section>

      <p className={planFootnote()}>{c.footnote(team.asOf)}</p>

      {changed ? (
        <>
          <div className={planBarSpace()} />
          <div className={planBar()}>
            <span className={planBarGain()}>
              <span className={planBarPoints()}>
                {c.planGain(signedDecimal(result.points - base.points, lang))} <span className={planBarSub()}>{c.window(first, last)}</span>
              </span>
              <span className={planBarSub()}>{c.transfersCount(totalTransfers, totalHits > 0 ? c.hit(totalHits) : c.free)}</span>
            </span>
            <button type="button" className={planBarButton()} onClick={() => open({ kind: "review" })}>
              {c.review}
            </button>
          </div>
        </>
      ) : null}

      {sheet?.kind === "player" ? (
        <PlayerSheet
          model={model}
          id={sheet.id}
          onClose={() => setSheet(null)}
          onTransferOut={() => open({ kind: "replace", out: sheet.id })}
          onChange={(next) => {
            commit(next);
            setSheet(null);
          }}
        />
      ) : null}
      {sheet?.kind === "chips" ? (
        <ChipsSheet
          model={model}
          onClose={() => setSheet(null)}
          onChange={(next) => {
            commit(next);
            setSheet(null);
          }}
        />
      ) : null}
    </div>
  );
}

export type BoardModel = {
  readonly data: PlanBoardView["data"];
  readonly ctx: ReturnType<typeof contextFor>;
  readonly players: ReturnType<typeof playerMap>;
  readonly clubs: ReadonlyMap<number, { readonly id: number; readonly name: string; readonly short: string }>;
  readonly lang: Lang;
  readonly copy: ReturnType<typeof planCopyFor>;
  readonly words: { readonly home: string; readonly away: string; readonly blank: string };
  readonly start: NonNullable<PlanBoardView["data"]["team"]>["start"];
  readonly week: WeekResult;
  readonly plan: readonly WeekPlan[];
};

function ChipsAside({ model }: { model: BoardModel }) {
  const firstHalf = model.data.rules.chips.find((w) => w.from <= model.week.gw && model.week.gw <= w.to);
  return firstHalf ? <span className={sectionAside()}>{model.copy.chipsAside(firstHalf.to)}</span> : null;
}

function ChipButton({ chip, model, onOpen }: { chip: Chip; model: BoardModel; onOpen: () => void }) {
  const { copy: c, lang } = model;
  const state = chipState(chip, model.week, model.start, model.plan, model.ctx);
  return (
    <button type="button" disabled={state.kind === "used"} className={chipCard({ playing: state.kind === "playing" })} onClick={onOpen}>
      <span className={chipName()}>{c.chips[chip]}</span>
      <span className={chipSub({ tone: state.kind === "gain" ? "gain" : state.kind === "used" ? "off" : "quiet" })}>
        {state.kind === "playing"
          ? c.chipPlaying
          : state.kind === "used"
            ? c.chipUsed(state.gw)
            : state.kind === "gain"
              ? state.captain !== null
                ? c.chipWith(signedDecimal(state.points, lang), model.players.get(state.captain)?.name ?? "")
                : c.chipThisWeek(signedDecimal(state.points, lang))
              : c.chipAvailable}
      </span>
    </button>
  );
}
