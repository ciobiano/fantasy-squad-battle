"use client";

// Draft from scratch (/planner/draft): fifteen shirts to fill within the budget
// and the club limit. An empty shirt opens the players for its position; a
// filled one shows the player, who can be removed. Once full the squad is
// rated and can be planned on the plan board like an imported team. Kept on
// this phone, with undo; the browser's back button closes the list and the board.
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Lang } from "@/lib/i18n";
import { planCopyFor, type PlanCopy } from "@/lib/i18n/plan";
import { POSITION_ORDER, type Position } from "@/lib/planner/engine";
import { draftChoices, draftFull, draftKey, draftLines, draftMoney, draftRating, draftTeam, fullClubs, readDraft, writeDraft } from "@/lib/screens/draft";
import { contextFor, emptyPlan, planKey, playerMap, writePlan } from "@/lib/screens/plan-board";
import type { PlanBoardView } from "@/lib/screens/planner";
import { decimal, money } from "@/lib/ui/format";
import { stripedClubs } from "@/lib/ui/kits";
import {
  button, column, draftLimit, draftLimitDot, onSkyTitle, outlineButton, panel, pitch, pitchLine, pitchLines, planBack, planFootnote, planHint,
  planNav, planStat, planStatLabel, planStats, planStatValue, planTool, planTools, planToken, ratingFigure, ratingNumber, ratingUnit,
  sheetClose, sheetHeader, sheetHeaderText, sheetMeta, sheetName, sheetShirt, slotLabel, tokenKit, tokenName, tokenPoints,
} from "@/lib/variants";
import { BackIcon, CloseIcon, RedoIcon, UndoIcon } from "../ui/icons";
import { EmptyShirt, PitchMarkings, Shirt } from "../ui/Pitch";
import { Sheet } from "../ui/Sheet";
import { keep, readKept, subscribeKept } from "./kept";
import { PlanBoard } from "./PlanBoard";
import { PlayerPicker } from "./PlayerPicker";

type Screen = { readonly kind: "draft" } | { readonly kind: "pick"; readonly position: Position } | { readonly kind: "plan" };

/** The screen a history entry was pushed for (see `open`). */
function screenOf(state: unknown): Screen {
  const s = (state ?? {}) as { draft?: unknown; position?: unknown };
  if (s.draft === "plan") return { kind: "plan" };
  const position = POSITION_ORDER.find((p) => p === s.position);
  return s.draft === "pick" && position ? { kind: "pick", position } : { kind: "draft" };
}

export function DraftBoard({ view, lang }: { view: PlanBoardView; lang: Lang }) {
  const c = planCopyFor(lang);
  const { data } = view;
  const { rules, gws } = data;
  const ctx = useMemo(() => contextFor(data), [data]);
  const players = useMemo(() => playerMap(data), [data]);
  const clubs = useMemo(() => new Map(data.clubs.map((club) => [club.id, club])), [data]);
  const words = useMemo(() => ({ home: c.home, away: c.away, blank: c.blank }), [c]);
  const key = draftKey(gws[0]);

  const stored = useSyncExternalStore(subscribeKept, () => readKept(key), () => null);
  const picks = useMemo(() => readDraft(stored, players, rules), [stored, players, rules]);
  const [undoStack, setUndoStack] = useState<readonly string[]>([]);
  const [redoStack, setRedoStack] = useState<readonly string[]>([]);
  const [screen, setScreen] = useState<Screen>({ kind: "draft" });
  const [sheet, setSheet] = useState<number | null>(null);

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      setSheet(null);
      setScreen(screenOf(event.state));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const open = (next: Screen) => {
    window.history.pushState({ ...window.history.state, draft: next.kind, position: next.kind === "pick" ? next.position : null }, "");
    setSheet(null);
    setScreen(next);
    window.scrollTo(0, 0);
  };
  const back = () => window.history.back();

  // A changed draft is another squad, so the plan made for the old one is dropped.
  const save = (value: string) => {
    keep(key, value);
    keep(planKey(null, gws[0]), writePlan(emptyPlan(gws)));
  };
  const current = writeDraft(picks);
  const commit = (next: readonly number[]) => {
    setUndoStack((u) => [...u, current]);
    setRedoStack([]);
    save(writeDraft(next));
  };
  const undo = () => {
    const previous = undoStack[undoStack.length - 1];
    if (previous === undefined) return;
    setUndoStack((u) => u.slice(0, -1));
    setRedoStack((r) => [current, ...r]);
    save(previous);
  };
  const redo = () => {
    const next = redoStack[0];
    if (next === undefined) return;
    setRedoStack((r) => r.slice(1));
    setUndoStack((u) => [...u, current]);
    save(next);
  };

  const full = draftFull(picks, rules);
  const boardView = useMemo(() => (full ? { data: { ...data, team: draftTeam(picks, data, players) }, idea: null } : null), [full, picks, data, players]);
  const rating = useMemo(() => (full ? draftRating(picks, ctx) : null), [full, picks, ctx]);
  const range = c.window(gws[0], gws[gws.length - 1]);

  if (screen.kind === "plan" && boardView) return <PlanBoard view={boardView} lang={lang} draft={{ onBack: back }} />;

  const { spent, left, toPick } = draftMoney(picks, players, rules);
  if (screen.kind === "pick") {
    const rows = draftChoices(picks, screen.position, data, players).map((ch) => ({ id: ch.id, value: ch.points, price: ch.price, blocked: ch.blocked }));
    return (
      <PlayerPicker
        model={{ copy: c, lang, data, players, clubs, words }}
        gw={gws[0]}
        position={screen.position}
        title={c.pickTitle(screen.position)}
        sub={c.pickSub(money(left, lang), toPick)}
        back={c.draftTitle}
        rows={rows}
        value={{ sort: c.sorts.projected, column: c.columnProjected(range), show: (points) => decimal(points, lang), tone: () => "plain" }}
        onBack={back}
        onPick={(id) => {
          commit([...picks, id]);
          back();
        }}
      />
    );
  }

  const limit = fullClubs(picks, players, rules).map((id) => clubs.get(id)?.name ?? "");
  const note = picks.length === 0 ? c.draftHint : toPick > 0 ? c.draftToPick(toPick, money(Math.floor(left / toPick), lang)) : null;
  const chosen = sheet === null ? null : players.get(sheet);

  return (
    <div lang={lang} className={column({ gap: "sm" })}>
      <nav aria-label={c.draftTitle} className={planNav()}>
        <Link href="/planner?start=1" className={planBack()}>
          <BackIcon />
          {c.draftBack}
        </Link>
        <span className={planTools()}>
          <button type="button" aria-label={c.undo} disabled={undoStack.length === 0} className={planTool()} onClick={undo}>
            <UndoIcon />
          </button>
          <button type="button" aria-label={c.redo} disabled={redoStack.length === 0} className={planTool()} onClick={redo}>
            <RedoIcon />
          </button>
        </span>
      </nav>
      <h1 className={onSkyTitle()}>{c.draftTitle}</h1>

      <dl className={planStats()}>
        <div className={planStat()}>
          <dt className={planStatLabel()}>{c.draftPlayers}</dt>
          <dd className={planStatValue()}>{`${picks.length}/${rules.squadSize}`}</dd>
        </div>
        <div className={planStat()}>
          <dt className={planStatLabel()}>{c.draftSpent}</dt>
          <dd className={planStatValue()}>{money(spent, lang)}</dd>
        </div>
        <div className={planStat()}>
          <dt className={planStatLabel()}>{c.draftLeft}</dt>
          <dd className={planStatValue()}>{money(left, lang)}</dd>
        </div>
      </dl>

      {rating !== null ? (
        <section aria-label={c.ptsProjected} className={panel()}>
          <p className={ratingFigure()}>
            <span className={ratingNumber()}>{Math.round(rating)}</span>
            <span className={ratingUnit()}>
              <span>{c.ptsProjected}</span>
              <span>{range}</span>
            </span>
          </p>
          <p className={planHint()}>{c.draftRatingNote}</p>
        </section>
      ) : null}
      {note ? <p className={planHint()}>{note}</p> : null}
      {limit.length > 0 ? (
        <p role="status" className={draftLimit()}>
          <span aria-hidden="true" className={draftLimitDot()} />
          {c.draftClubFull(rules.clubLimit, limit.join(", "))}
        </p>
      ) : null}

      <DraftPitch
        lines={draftLines(picks, players, rules)}
        clubs={data.clubs.map((cl) => cl.short)}
        label={c.draftTitle}
        tokenFor={(id) => {
          const p = players.get(id)!;
          const short = clubs.get(p.club)?.short ?? "";
          return { name: p.name, club: short, price: money(p.price, lang), aria: `${p.name}, ${short}, ${money(p.price, lang)}` };
        }}
        copy={c}
        onEmpty={(position) => open({ kind: "pick", position })}
        onPlayer={setSheet}
      />

      {full ? (
        <button type="button" className={button({ intent: "primary" })} onClick={() => open({ kind: "plan" })}>
          {c.planTransfers}
        </button>
      ) : null}
      {picks.length > 0 ? (
        <button type="button" className={button({ intent: "quiet" })} onClick={() => commit([])}>
          {c.clearDraft}
        </button>
      ) : null}
      <p className={planFootnote()}>{c.draftKept}</p>

      {chosen ? (
        <Sheet open onClose={() => setSheet(null)} labelledBy="draft-player-h">
          <header className={sheetHeader()}>
            <span className={sheetShirt()}>
              <Shirt club={clubs.get(chosen.club)?.short ?? ""} />
            </span>
            <span className={sheetHeaderText()}>
              <h2 id="draft-player-h" className={sheetName()}>
                {chosen.name}
              </h2>
              <span className={sheetMeta()}>{[clubs.get(chosen.club)?.name, c.positions[chosen.position], money(chosen.price, lang)].join(" · ")}</span>
            </span>
            <button type="button" aria-label={c.close} className={sheetClose()} onClick={() => setSheet(null)}>
              <CloseIcon />
            </button>
          </header>
          <p className={planHint()}>{c.projectedTotal(decimal(chosen.points.reduce((sum, x) => sum + x, 0), lang), range)}</p>
          <button
            type="button"
            className={outlineButton()}
            onClick={() => {
              commit(picks.filter((id) => id !== chosen.id));
              setSheet(null);
            }}
          >
            {c.removeFromDraft}
          </button>
        </Sheet>
      ) : null}
    </div>
  );
}

interface DraftToken {
  readonly name: string;
  readonly club: string;
  readonly price: string;
  readonly aria: string;
}

function DraftPitch({ lines, clubs, label, tokenFor, copy: c, onEmpty, onPlayer }: {
  lines: ReturnType<typeof draftLines>;
  clubs: readonly string[];
  label: string;
  tokenFor: (id: number) => DraftToken;
  copy: PlanCopy;
  onEmpty: (position: Position) => void;
  onPlayer: (id: number) => void;
}) {
  return (
    <section aria-label={label} className={pitch()}>
      <PitchMarkings stripedClubs={stripedClubs(clubs)} />
      <div className={pitchLines()}>
        {lines.map((line, i) => (
          <div key={i} className={pitchLine()}>
            {line.map((slot, j) => {
              if (slot.id === null) {
                return (
                  <button key={`empty-${j}`} type="button" aria-label={c.slotAria(slot.position)} className={planToken()} onClick={() => onEmpty(slot.position)}>
                    <span className={tokenKit()}>
                      <EmptyShirt />
                    </span>
                    <span aria-hidden="true" className={slotLabel()}>
                      {slot.position}
                    </span>
                  </button>
                );
              }
              const id = slot.id;
              const t = tokenFor(id);
              return (
                <button key={id} type="button" aria-label={t.aria} className={planToken()} onClick={() => onPlayer(id)}>
                  <span className={tokenKit()}>
                    <Shirt club={t.club} />
                  </span>
                  <span aria-hidden="true" className={tokenPoints()}>
                    {t.price}
                  </span>
                  <span aria-hidden="true" className={tokenName()}>
                    {t.name}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
