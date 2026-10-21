// Review the plan: what it adds over doing nothing, week by week, and the
// reminder that transfers are made on FPL (we never touch the account).
import type { PlanResult } from "@/lib/planner/engine";
import { review } from "@/lib/screens/plan-board";
import { decimal, deadlineText, signedDecimal } from "@/lib/ui/format";
import {
  column, compareGain, ideaArrow, ideaMove, ideaOut, ideaSub, onSkyTitle, panel, panelBody, panelTitle, planBack, planFootnote, planNav,
  ratingFigure, ratingUnit, reviewRow, reviewRows, reviewGw, reviewPoints, reviewText, sectionHead, sectionHeading, outlineLink,
} from "@/lib/variants";
import { ArrowRight, BackIcon, ExternalIcon } from "../ui/icons";
import type { BoardModel } from "./PlanBoard";

export function PlanReview({ model, result, base, onBack }: { model: BoardModel; result: PlanResult; base: PlanResult; onBack: () => void }) {
  const { copy: c, lang, data, players } = model;
  const r = review(result, base, data.rules.hitCost);
  const name = (id: number) => players.get(id)?.name ?? "";
  return (
    <div lang={lang} className={column({ gap: "lg" })}>
      <nav aria-label={c.reviewTitle} className={planNav()}>
        <button type="button" className={planBack()} onClick={onBack}>
          <BackIcon />
          {c.title}
        </button>
      </nav>
      <h1 className={onSkyTitle()}>{c.reviewTitle}</h1>

      <section aria-label={c.vsNone}>
        <p className={ratingFigure()}>
          <span className={compareGain()}>{signedDecimal(r.gain, lang)}</span>
          <span className={ratingUnit()}>
            <span>{c.vsNone}</span>
            <span>{c.window(data.gws[0], data.gws[data.gws.length - 1])}</span>
          </span>
        </p>
        <p className={planFootnote()}>{c.projectedChange(String(Math.round(r.points)), String(Math.round(r.base)))}</p>
      </section>

      <section aria-labelledby="review-weeks">
        <div className={sectionHead()}>
          <h2 id="review-weeks" className={sectionHeading()}>
            {c.weekByWeek}
          </h2>
        </div>
        <ol className={reviewRows()}>
          {r.weeks.map((w) => {
            const cost = w.hits > 0 ? c.hit(w.hits) : w.transfers.length > 0 ? c.costFree : null;
            const note = [cost, w.chip ? c.chips[w.chip] : null, c.captainNote(name(w.captain))].filter(Boolean).join(" · ");
            return (
              <li key={w.gw} className={reviewRow()}>
                <span className={reviewGw()}>{c.gw(w.gw)}</span>
                <span className={reviewText()}>
                  {w.transfers.map((t) => (
                    <span key={`${t.out}-${t.in}`} className={ideaMove()} aria-label={c.moveAria(name(t.out), name(t.in))}>
                      <span aria-hidden="true" className={ideaOut()}>
                        {name(t.out)}
                      </span>
                      <ArrowRight className={ideaArrow()} />
                      <span aria-hidden="true">{name(t.in)}</span>
                    </span>
                  ))}
                  <span className={ideaSub()}>{note}</span>
                </span>
                <span className={reviewPoints()}>{decimal(w.points, lang)}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="fpl-h" className={panel()}>
        <h2 id="fpl-h" className={panelTitle()}>
          {c.fplTitle}
        </h2>
        {data.deadline ? <p className={panelBody()}>{c.fplBody(deadlineText(data.deadline, lang))}</p> : null}
        <a href="https://fantasy.premierleague.com/transfers" target="_blank" rel="noopener noreferrer" className={outlineLink()}>
          {c.openFpl}
          <ExternalIcon />
        </a>
      </section>
      <p className={planFootnote()}>{c.estimates}</p>
    </div>
  );
}
